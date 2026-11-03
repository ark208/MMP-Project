import { env } from '../config/env';

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IWhatsAppProvider {
  sendMessage(toPhone: string, message: string): Promise<WhatsAppSendResult>;
}

/**
 * Stub WhatsApp provider for development and testing.
 * Logs WhatsApp notifications to the console.
 * Can be swapped for Twilio, Meta WhatsApp Cloud API, or Infobip at runtime or in production.
 */
export class StubWhatsAppProvider implements IWhatsAppProvider {
  name = 'StubWhatsAppProvider';

  async sendMessage(toPhone: string, message: string): Promise<WhatsAppSendResult> {
    const messageId = `wa_stub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    console.log(`\n======================================================`);
    console.log(`💬 [WHATSAPP STUB NOTIFICATION]`);
    console.log(`📱 Recipient: ${toPhone}`);
    console.log(`🆔 Message ID: ${messageId}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`📝 Message:`);
    console.log(message.trim());
    console.log(`======================================================\n`);

    return {
      success: true,
      messageId,
    };
  }
}

class WhatsAppService {
  private provider: IWhatsAppProvider;

  constructor(provider?: IWhatsAppProvider) {
    this.provider = provider || new StubWhatsAppProvider();
  }

  /**
   * Allows replacing the stub provider with a live provider (e.g., Twilio / Meta Cloud API)
   */
  setProvider(provider: IWhatsAppProvider) {
    this.provider = provider;
  }

  getProvider(): IWhatsAppProvider {
    return this.provider;
  }

  async sendRawMessage(toPhone: string, message: string): Promise<WhatsAppSendResult> {
    if (!toPhone) {
      return { success: false, error: 'Recipient phone number is required' };
    }
    return this.provider.sendMessage(toPhone, message);
  }

  async sendMatchNotification(
    toPhone: string,
    params: {
      userName: string;
      itemTitle: string;
      matchTitle: string;
      score: number;
      reasons: string[];
      matchUrl?: string;
    }
  ): Promise<WhatsAppSendResult> {
    const reasonsList = params.reasons.map((r) => ` • ${r}`).join('\n');
    const scorePercent = Math.round(params.score * 100);
    const text = `🔔 *CampusLoop Lost & Found Match Alert!*\n\nHi ${params.userName},\n\nWe found a potential match (${scorePercent}% match score) for your item *"${params.itemTitle}"* with recently reported *"${params.matchTitle}"*.\n\n*Reasons:*\n${reasonsList}\n\nCheck details on CampusLoop: ${params.matchUrl || env.CLIENT_URL}`;

    return this.sendRawMessage(toPhone, text);
  }

  async sendRideJoinNotification(
    toPhone: string,
    params: {
      creatorName: string;
      passengerName: string;
      origin: string;
      destination: string;
      departureTime?: Date | string;
      rideUrl?: string;
    }
  ): Promise<WhatsAppSendResult> {
    const timeStr = params.departureTime ? `\n⏰ Departure: ${new Date(params.departureTime).toLocaleString()}` : '';
    const text = `🚗 *CampusLoop Ride Update!*\n\nHi ${params.creatorName},\n\n*${params.passengerName}* just joined your ride from *${params.origin}* to *${params.destination}*.${timeStr}\n\nView ride details: ${params.rideUrl || `${env.CLIENT_URL}/rides`}`;

    return this.sendRawMessage(toPhone, text);
  }

  async sendMessageNotification(
    toPhone: string,
    params: {
      recipientName: string;
      senderName: string;
      messageSnippet: string;
      chatUrl?: string;
    }
  ): Promise<WhatsAppSendResult> {
    const text = `💬 *CampusLoop New Message!*\n\nHi ${params.recipientName},\n\nYou have a new message from *${params.senderName}*:\n"${params.messageSnippet}"\n\nReply on CampusLoop: ${params.chatUrl || `${env.CLIENT_URL}/chat`}`;

    return this.sendRawMessage(toPhone, text);
  }
}

export const whatsappService = new WhatsAppService();

