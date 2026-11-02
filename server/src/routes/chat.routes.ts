import { Router, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { HttpError } from '../errors';
import { notificationService } from '../services/notification.service';
import { getSocketIO } from '../socket';

const router = Router();

// GET /api/conversations - List conversations for authenticated user
// Contact details (email, phone) are strictly omitted
router.get('/', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;

    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    const safeList = conversations.map((conv: any) => {
      // Safe members projection: strictly no email or phone
      const safeMembers = (conv.members || []).map((m: any) => ({
        id: m.userId,
        joinedAt: m.joinedAt,
        user: m.user
          ? {
              id: m.user.id,
              name: m.user.name,
              avatarUrl: m.user.avatarUrl || null,
              department: m.user.department || null,
              year: m.user.year || null,
            }
          : undefined,
      }));

      return {
        id: conv.id,
        isGroup: conv.isGroup,
        title: conv.title,
        rideId: conv.rideId,
        participantIds: (conv.members || []).map((m: any) => m.userId),
        participants: safeMembers.map((sm: any) => sm.user).filter(Boolean),
        lastMessage: conv.lastMessage
          ? {
              id: conv.lastMessage.id,
              conversationId: conv.lastMessage.conversationId,
              senderId: conv.lastMessage.senderId,
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt,
            }
          : null,
        updatedAt: conv.updatedAt,
      };
    });

    res.json({
      data: safeList,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations - Start or retrieve direct conversation
router.post('/', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { recipientId } = req.body;

    if (!recipientId) {
      throw new HttpError(400, 'BAD_REQUEST', 'recipientId is required');
    }

    if (recipientId === user.id) {
      throw new HttpError(400, 'BAD_REQUEST', 'Cannot create a direct conversation with yourself');
    }

    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      throw new HttpError(404, 'NOT_FOUND', 'Recipient user not found');
    }

    // Check if a 1-to-1 conversation already exists between both users
    const myConvs = await prisma.conversationMember.findMany({
      where: { userId: user.id },
    });
    const myConvIds = myConvs.map((mc: any) => mc.conversationId);

    const recipientConvs = await prisma.conversationMember.findMany({
      where: {
        userId: recipientId,
        conversationId: { in: myConvIds },
      },
    });

    for (const match of recipientConvs) {
      const conv = await prisma.conversation.findUnique({
        where: { id: match.conversationId },
      });
      if (conv && !conv.isGroup && !conv.rideId) {
        return res.json({
          data: {
            id: conv.id,
            isGroup: false,
            participantIds: [user.id, recipientId],
            createdAt: conv.createdAt,
          },
        });
      }
    }

    // Create new direct conversation
    const newConv = await prisma.$transaction(async (tx: any) => {
      const conversation = await tx.conversation.create({
        data: {
          isGroup: false,
        },
      });

      await tx.conversationMember.createMany({
        data: [
          { conversationId: conversation.id, userId: user.id },
          { conversationId: conversation.id, userId: recipientId },
        ],
      });

      return conversation;
    });

    res.status(201).json({
      data: {
        id: newConv.id,
        isGroup: false,
        participantIds: [user.id, recipientId],
        createdAt: newConv.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id/messages - Get message history
// Privacy rule: Contact details are never exposed
router.get('/:id/messages', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { limit, before } = req.query;

    // Verify user is a member of the conversation
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: String(id),
          userId: user.id,
        },
      },
    });

    if (!member && user.role !== 'ADMIN') {
      throw new HttpError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    const takeLimit = limit ? parseInt(String(limit), 10) : 50;
    const where: any = { conversationId: id };
    if (before) {
      where.createdAt = { lt: new Date(String(before)) };
    }

    const messages = await prisma.message.findMany({
      where,
      take: takeLimit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            department: true,
            year: true,
            // Strictly exclude email and phone
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const safeMessages = messages.map((m: any) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      sender: m.sender
        ? {
            id: m.sender.id,
            name: m.sender.name,
            avatarUrl: m.sender.avatarUrl || null,
            department: m.sender.department || null,
            year: m.sender.year || null,
          }
        : undefined,
      content: m.content,
      createdAt: m.createdAt,
    }));

    res.json({
      data: safeMessages,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages - Send a message and emit socket event
router.post('/:id/messages', authenticateUser, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id: conversationId } = req.params;
    const user = req.user!;
    const conversationIdStr = String(conversationId);
    const { content } = req.body;

    if (!content || !content.trim()) {
      throw new HttpError(400, 'BAD_REQUEST', 'Message content cannot be empty');
    }

    // Verify user is member of conversation
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conversationIdStr,
          userId: user.id,
        },
      },
    });

    if (!member && user.role !== 'ADMIN') {
      throw new HttpError(403, 'FORBIDDEN', 'You are not a participant in this conversation');
    }

    // Persist message in database
    const message = await prisma.message.create({
      data: {
        conversationId: conversationIdStr,
        senderId: user.id,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            department: true,
            year: true,
          },
        },
      },
    }) as any;

    const safeSender = {
      id: user.id,
      name: user.name,
      avatarUrl: message.sender?.avatarUrl || null,
      department: user.department || null,
      year: user.year || null,
    };

    const payload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: safeSender,
      content: message.content,
      createdAt: message.createdAt,
    };

    // Emit Socket.io message:new event to the conversation room
    const io = getSocketIO();
    if (io) {
      io.to(`conversation:${conversationIdStr}`).emit('message:new', payload);
    }

    // Send notifications to all other members in the conversation
    try {
      const allMembers = await prisma.conversationMember.findMany({
        where: { conversationId: conversationIdStr },
      });
      const recipientIds = allMembers.map((m: any) => m.userId);
      await notificationService.notifyNewMessage(
        recipientIds,
        { id: user.id, name: user.name },
        conversationIdStr,
        message.content
      );
    } catch (notifErr) {
      console.warn('[Chat] Notification dispatch error:', notifErr);
    }

    res.status(201).json({
      data: payload,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
