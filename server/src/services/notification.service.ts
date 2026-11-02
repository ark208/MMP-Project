import { prisma } from '../prisma';
import { getSocketIO } from '../socket';

export type NotificationType = 'MATCH' | 'CLAIM' | 'CHAT' | 'RIDE' | 'SYSTEM';

export interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

export const notificationService = {
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

  async notifyPassengerJoined(ride: any, passenger: { id: string; name: string }) {
    if (ride.creatorId === passenger.id) return;
    return this.createNotification({
      userId: ride.creatorId,
      title: 'New Passenger Joined!',
      message: `${passenger.name} joined your ride from ${ride.origin} to ${ride.destination}.`,
      type: 'RIDE',
      link: `/rides/${ride.id}`,
    });
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

  async notifyNewMessage(
    recipientUserIds: string[],
    sender: { id: string; name: string },
    conversationId: string,
    content: string
  ) {
    const preview = content.length > 50 ? `${content.substring(0, 47)}...` : content;
    const promises = recipientUserIds
      .filter((id) => id !== sender.id)
      .map((userId) =>
        this.createNotification({
          userId,
          title: `New message from ${sender.name}`,
          message: preview,
          type: 'CHAT',
          link: `/chat/${conversationId}`,
        })
      );

    return Promise.all(promises);
  },
};
