import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { WhatsAppWebhookPayload } from '@getcloser/shared';
import { WhatsAppService } from './whatsapp.service.js';
import { QualificationService } from '../agent/qualification.service.js';

@Controller('webhook')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly qualificationService: QualificationService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') verifyToken: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const expectedToken = this.configService.getOrThrow<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && verifyToken === expectedToken) {
      return challenge;
    }
    throw new ForbiddenException();
  }

  @Post()
  @HttpCode(200)
  receiveMessage(@Body() payload: WhatsAppWebhookPayload): { status: string } {
    const msg = this.whatsappService.parseInbound(payload);
    if (msg) {
      this.logger.log(`Inbound from ${msg.from}: ${msg.text}`);
      const agentId = this.configService.getOrThrow<string>('DEFAULT_AGENT_ID');
      // Fire and forget — Meta requires immediate 200 response
      void this.qualificationService.handleInbound(msg.from, msg.text, agentId);
    }
    return { status: 'ok' };
  }
}
