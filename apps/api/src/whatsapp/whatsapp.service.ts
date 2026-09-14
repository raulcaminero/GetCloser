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

  async sendMessage(
    to: string,
    text: string,
    credentials?: { phoneNumberId?: string | null; accessToken?: string | null },
  ): Promise<void> {
    const phoneNumberId = credentials?.phoneNumberId || this.phoneNumberId;
    const accessToken = credentials?.accessToken || this.accessToken;

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
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
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );
  }

  getInboundPhoneNumberId(payload: WhatsAppWebhookPayload): string | null {
    return payload.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ?? null;
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
