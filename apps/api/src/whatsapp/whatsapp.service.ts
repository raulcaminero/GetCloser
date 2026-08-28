import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { WhatsAppWebhookPayload, WhatsAppInboundMessage } from '@getcloser/shared';

@Injectable()
export class WhatsAppService {
  private readonly phoneNumberId: string;
  private readonly accessToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.phoneNumberId = this.configService.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.configService.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN');
  }

  async sendMessage(to: string, text: string): Promise<void> {
    const url = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
    await firstValueFrom(
      this.httpService.post(
        url,
        {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }

  parseInbound(payload: WhatsAppWebhookPayload): WhatsAppInboundMessage | null {
    const messages = payload.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages?.length) return null;

    const msg = messages.find((m) => m.type === 'text');
    if (!msg) return null;

    return {
      from: msg.from,
      messageId: msg.id,
      text: msg.text.body,
      timestamp: Number(msg.timestamp),
    };
  }
}
