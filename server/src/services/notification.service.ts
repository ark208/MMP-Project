import { prisma } from '../prisma';
import { getSocketIO } from '../socket';
import { sendMatchEmail, sendRideJoinEmail, sendMessageEmail } from './email.service';
import { whatsappService } from './whatsapp.service';

export type NotificationType = 'MATCH' | 'CLAIM' | 'CHAT' | 'RIDE' | 'SYSTEM';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export interface UserPreferences {
  id?: string;
  userId: string;
  emailMatches: boolean;
  emailRideJoins: boolean;
  emailMessages: boolean;
  whatsappMatches: boolean;
  whatsappRideJoins: boolean;
  whatsappMessages: boolean;
  whatsappNumber?: string | null;
}

export const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId'> = {
  emailMatches: true,
  emailRideJoins: true,
  emailMessages: true,
  whatsappMatches: false,
  whatsappRideJoins: false,
  whatsappMessages: false,
  whatsappNumber: null,
};

export const notificationService = {
  /**
   * Retrieves or initializes default notification preferences for a user
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      if ((prisma as any).notificationPreference) {
        const pref = await (prisma as any).notificationPreference.findUnique({
          where: { userId },
        });
        if (pref) return pref;
      }
    } catch (err) {
      console.warn('[NotificationService] Error fetching preferences, using defaults:', err);
    }

    return {
      userId,
      ...DEFAULT_PREFERENCES,
    };
  },

  /**
   * Updates notification preferences for a user
   */
  async updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'id' | 'userId'>>
  ): Promise<UserPreferences> {
    if ((prisma as any).notificationPreference) {
      const pref = await (prisma as any).notificationPreference.upsert({
        where: { userId },
        update: { ...updates },
        create: {
          userId,
          ...DEFAULT_PREFERENCES,
          ...updates,
        },
      });
      return pref;
    }

    return {
      userId,
      ...DEFAULT_PREFERENCES,
      ...updates,
    };
  },

  /**
   * Core in-app notification creator and Socket.io emitter
   */
  async createNotification(params: CreateNotificationParams) {
    try {
      const notif = await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type,
          link: params.link || null,
        },
      });

      // Emit real-time notification to user's dedicated socket room
      const io = getSocketIO();
      if (io) {
        io.to(`user:${params.userId}`).emit('notification:new', notif);
      }

      return notif;
    } catch (err) {
      console.error('[NotificationService] Failed to create notification:', err);
      return null;
    }
  },

  /**
   * Lost & Found Match Notification (In-App + Email + WhatsApp)
   */
  async notifyItemMatch(params: {
    lostItem: any;
    foundItem: any;
    matchId: string;
    score: number;
    reasons: string[];
  }) {
    const { lostItem, foundItem, matchId, score, reasons } = params;
    const scorePct = Math.round(score * 100);

    // 1. Notify Lost Item Owner
    try {
      const lostUser = await prisma.user.findUnique({ where: { id: lostItem.userId } });
      if (lostUser) {
        await this.createNotification({
          userId: lostUser.id,
          title: 'Possible Item Match!',
          message: `A found item matching "${lostItem.title}" was recently posted (${scorePct}% match).`,
          type: 'MATCH',
          link: `/lost-found/match/${matchId}`,
        });

        const prefs = await this.getUserPreferences(lostUser.id);

        if (prefs.emailMatches && lostUser.email) {
          await sendMatchEmail(lostUser.email, {
            userName: lostUser.name,
            itemTitle: lostItem.title,
            matchTitle: foundItem.title,
            score,
            reasons,
            matchUrl: `/lost-found/match/${matchId}`,
          });
        }

        const phone = prefs.whatsappNumber || lostUser.phone;
        if (prefs.whatsappMatches && phone) {
          await whatsappService.sendMatchNotification(phone, {
            userName: lostUser.name,
            itemTitle: lostItem.title,
            matchTitle: foundItem.title,
            score,
            reasons,
            matchUrl: `/lost-found/match/${matchId}`,
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] Failed to notify lost item owner:', err);
    }

    // 2. Notify Found Item Finder
    try {
      const foundUser = await prisma.user.findUnique({ where: { id: foundItem.userId } });
      if (foundUser) {
        await this.createNotification({
          userId: foundUser.id,
          title: 'Possible Item Match!',
          message: `A lost item matching "${foundItem.title}" was recently posted (${scorePct}% match).`,
          type: 'MATCH',
          link: `/lost-found/match/${matchId}`,
        });

        const prefs = await this.getUserPreferences(foundUser.id);

        if (prefs.emailMatches && foundUser.email) {
          await sendMatchEmail(foundUser.email, {
            userName: foundUser.name,
            itemTitle: foundItem.title,
            matchTitle: lostItem.title,
            score,
            reasons,
            matchUrl: `/lost-found/match/${matchId}`,
          });
        }

        const phone = prefs.whatsappNumber || foundUser.phone;
        if (prefs.whatsappMatches && phone) {
          await whatsappService.sendMatchNotification(phone, {
            userName: foundUser.name,
            itemTitle: foundItem.title,
            matchTitle: lostItem.title,
            score,
            reasons,
            matchUrl: `/lost-found/match/${matchId}`,
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] Failed to notify found item finder:', err);
    }
  },

  /**
   * Ride Passenger Joined Notification (In-App + Email + WhatsApp)
   */
  async notifyPassengerJoined(ride: any, passenger: { id: string; name: string }) {
    if (ride.creatorId === passenger.id) return;

    // 1. In-app notification
    const notif = await this.createNotification({
      userId: ride.creatorId,
      title: 'New Passenger Joined!',
      message: `${passenger.name} joined your ride from ${ride.origin} to ${ride.destination}.`,
      type: 'RIDE',
      link: `/rides/${ride.id}`,
    });

    // 2. Channel notifications based on creator's preferences
    try {
      const creator = await prisma.user.findUnique({ where: { id: ride.creatorId } });
      if (creator) {
        const prefs = await this.getUserPreferences(creator.id);

        if (prefs.emailRideJoins && creator.email) {
          await sendRideJoinEmail(creator.email, {
            creatorName: creator.name,
            passengerName: passenger.name,
            origin: ride.origin,
            destination: ride.destination,
            departureTime: ride.departureTime,
            availableSeats: ride.availableSeats,
            rideUrl: `/rides/${ride.id}`,
          });
        }

        const phone = prefs.whatsappNumber || creator.phone;
        if (prefs.whatsappRideJoins && phone) {
          await whatsappService.sendRideJoinNotification(phone, {
            creatorName: creator.name,
            passengerName: passenger.name,
            origin: ride.origin,
            destination: ride.destination,
            departureTime: ride.departureTime,
            rideUrl: `/rides/${ride.id}`,
          });
        }
      }
    } catch (err) {
      console.error('[NotificationService] Error dispatching ride join notifications:', err);
    }

    return notif;
  },

  async notifyRideFull(ride: any) {
    return this.createNotification({
      userId: ride.creatorId,
      title: 'Ride Reached Full Capacity',
      message: `Your ride from ${ride.origin} to ${ride.destination} is now full (${ride.totalSeats} seats booked).`,
      type: 'RIDE',
      link: `/rides/${ride.id}`,
    });
  },

  async notifyTrainBuddyMatch(
    recipientUserId: string,
    buddyTrip: { trainNumber: string; date: string; fromStation: string; toStation: string },
    buddyName: string
  ) {
    return this.createNotification({
      userId: recipientUserId,
      title: 'New Train Buddy Radar Alert!',
      message: `${buddyName} is also traveling on Train #${buddyTrip.trainNumber} (${buddyTrip.fromStation} → ${buddyTrip.toStation}) on ${buddyTrip.date}.`,
      type: 'MATCH',
      link: `/trips`,
    });
  },

  /**
   * New Chat Message Notification (In-App + Email + WhatsApp)
   */
  async notifyNewMessage(
    recipientUserIds: string[],
    sender: { id: string; name: string },
    conversationId: string,
    content: string
  ) {
    const preview = content.length > 50 ? `${content.substring(0, 47)}...` : content;
    const recipients = recipientUserIds.filter((id) => id !== sender.id);

    const promises = recipients.map(async (userId) => {
      // 1. In-app notification
      await this.createNotification({
        userId,
        title: `New message from ${sender.name}`,
        message: preview,
        type: 'CHAT',
        link: `/chat/${conversationId}`,
      });

      // 2. Email & WhatsApp notifications based on recipient preferences
      try {
        const recipient = await prisma.user.findUnique({ where: { id: userId } });
        if (recipient) {
          const prefs = await this.getUserPreferences(userId);

          if (prefs.emailMessages && recipient.email) {
            await sendMessageEmail(recipient.email, {
              recipientName: recipient.name,
              senderName: sender.name,
              messageSnippet: preview,
              chatUrl: `/chat/${conversationId}`,
            });
          }

          const phone = prefs.whatsappNumber || recipient.phone;
          if (prefs.whatsappMessages && phone) {
            await whatsappService.sendMessageNotification(phone, {
              recipientName: recipient.name,
              senderName: sender.name,
              messageSnippet: preview,
              chatUrl: `/chat/${conversationId}`,
            });
          }
        }
      } catch (err) {
        console.error(`[NotificationService] Error sending message alert to user ${userId}:`, err);
      }
    });

    return Promise.all(promises);
  },
};
