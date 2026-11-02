import request from 'supertest';
import { app } from '../index';
import { prisma } from '../config/prisma';
import { generateToken } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { whatsappService, IWhatsAppProvider, WhatsAppSendResult } from '../services/whatsapp.service';
import * as emailService from '../services/email.service';

describe('Notification Preferences, Nodemailer & WhatsApp Notifications', () => {
  let user: any;
  let token: string;

  beforeEach(async () => {
    user = await prisma.user.create({
      data: {
        email: 'preftest@campus.edu',
        name: 'Preference Tester',
        phone: '+15551234567',
        role: 'USER',
      },
    });
    token = generateToken(user);
  });

  describe('User Preferences Endpoints', () => {
    it('returns default preferences on initial GET /api/notifications/preferences', async () => {
      const res = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        emailMatches: true,
        emailRideJoins: true,
        emailMessages: true,
        whatsappMatches: false,
        whatsappRideJoins: false,
        whatsappMessages: false,
      });
    });

    it('updates preferences via PATCH /api/notifications/preferences', async () => {
      const res = await request(app)
        .patch('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({
          emailMatches: false,
          whatsappMatches: true,
          whatsappNumber: '+15559876543',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.emailMatches).toBe(false);
      expect(res.body.data.whatsappMatches).toBe(true);
      expect(res.body.data.whatsappNumber).toBe('+15559876543');
      // Other settings preserved
      expect(res.body.data.emailRideJoins).toBe(true);

      // Verify persisted
      const getRes = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.body.data.emailMatches).toBe(false);
      expect(getRes.body.data.whatsappMatches).toBe(true);
    });
  });

  describe('Notification Dispatch & Channels', () => {
    let mockWhatsAppProvider: IWhatsAppProvider;
    let sentWhatsAppMessages: { to: string; message: string }[];
    let sendMatchEmailSpy: jest.SpyInstance;
    let sendRideJoinEmailSpy: jest.SpyInstance;
    let sendMessageEmailSpy: jest.SpyInstance;

    beforeEach(() => {
      sentWhatsAppMessages = [];
      mockWhatsAppProvider = {
        async sendMessage(toPhone: string, message: string): Promise<WhatsAppSendResult> {
          sentWhatsAppMessages.push({ to: toPhone, message });
          return { success: true, messageId: `mock_${Date.now()}` };
        },
      };

      // Set custom provider on WhatsApp service
      whatsappService.setProvider(mockWhatsAppProvider);

      // Spy on email functions
      sendMatchEmailSpy = jest.spyOn(emailService, 'sendMatchEmail');
      sendRideJoinEmailSpy = jest.spyOn(emailService, 'sendRideJoinEmail');
      sendMessageEmailSpy = jest.spyOn(emailService, 'sendMessageEmail');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('respects email toggles: dispatches email when true, skips when false', async () => {
      const lostUser = await prisma.user.create({
        data: {
          email: 'lostowner@campus.edu',
          name: 'Lost Owner',
          role: 'USER',
        },
      });

      const foundUser = await prisma.user.create({
        data: {
          email: 'foundfinder@campus.edu',
          name: 'Found Finder',
          role: 'USER',
        },
      });

      // Enable email for lostUser, disable email for foundUser
      await notificationService.updateUserPreferences(lostUser.id, { emailMatches: true });
      await notificationService.updateUserPreferences(foundUser.id, { emailMatches: false });

      await notificationService.notifyItemMatch({
        lostItem: { id: 'l1', userId: lostUser.id, title: 'Lost Keys' },
        foundItem: { id: 'f1', userId: foundUser.id, title: 'Found Keys' },
        matchId: 'm1',
        score: 0.85,
        reasons: ['Same category', 'Same location'],
      });

      // lostUser should receive email
      expect(sendMatchEmailSpy).toHaveBeenCalledWith(
        'lostowner@campus.edu',
        expect.objectContaining({
          userName: 'Lost Owner',
          itemTitle: 'Lost Keys',
          score: 0.85,
        })
      );

      // foundUser should NOT receive email because emailMatches is false
      expect(sendMatchEmailSpy).not.toHaveBeenCalledWith(
        'foundfinder@campus.edu',
        expect.anything()
      );
    });

    it('dispatches WhatsApp alerts when WhatsApp preference is enabled and phone exists', async () => {
      const driver = await prisma.user.create({
        data: {
          email: 'driver@campus.edu',
          name: 'Driver Dave',
          phone: '+15553334444',
          role: 'USER',
        },
      });

      await notificationService.updateUserPreferences(driver.id, {
        whatsappRideJoins: true,
      });

      const fakeRide = {
        id: 'r1',
        creatorId: driver.id,
        origin: 'Campus Library',
        destination: 'Central Station',
        departureTime: new Date(),
        availableSeats: 2,
      };

      await notificationService.notifyPassengerJoined(fakeRide, {
        id: 'p1',
        name: 'Passenger Pete',
      });

      // Check that WhatsApp message was sent to driver's phone
      expect(sentWhatsAppMessages.length).toBe(1);
      expect(sentWhatsAppMessages[0].to).toBe('+15553334444');
      expect(sentWhatsAppMessages[0].message).toContain('Passenger Pete');
      expect(sentWhatsAppMessages[0].message).toContain('Campus Library');
    });

    it('dispatches chat message notifications according to recipient preferences', async () => {
      const recipientA = await prisma.user.create({
        data: {
          email: 'alice.chat@campus.edu',
          name: 'Alice Chat',
          role: 'USER',
        },
      });

      const recipientB = await prisma.user.create({
        data: {
          email: 'bob.chat@campus.edu',
          name: 'Bob Chat',
          phone: '+15559998888',
          role: 'USER',
        },
      });

      // Alice: email enabled, whatsapp disabled
      await notificationService.updateUserPreferences(recipientA.id, {
        emailMessages: true,
        whatsappMessages: false,
      });

      // Bob: email disabled, whatsapp enabled
      await notificationService.updateUserPreferences(recipientB.id, {
        emailMessages: false,
        whatsappMessages: true,
      });

      await notificationService.notifyNewMessage(
        [recipientA.id, recipientB.id],
        { id: 'sender_1', name: 'Carol' },
        'conv_123',
        'Hello everyone! Are we meeting at 5?'
      );

      // Alice gets email
      expect(sendMessageEmailSpy).toHaveBeenCalledWith(
        'alice.chat@campus.edu',
        expect.objectContaining({
          recipientName: 'Alice Chat',
          senderName: 'Carol',
        })
      );

      // Bob does not get email
      expect(sendMessageEmailSpy).not.toHaveBeenCalledWith(
        'bob.chat@campus.edu',
        expect.anything()
      );

      // Bob gets WhatsApp
      expect(sentWhatsAppMessages.some((m) => m.to === '+15559998888')).toBe(true);
    });
  });
});

