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
import { AgentService } from '../agent/agent.service.js';

@Controller('webhook')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly qualificationService: QualificationService,
    private readonly agentService: AgentService,
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
      
      const inboundPhoneNumberId = this.whatsappService.getInboundPhoneNumberId(payload);
      
      const processMessage = async () => {
        let agentId: string | null = null;
        if (inboundPhoneNumberId) {
          const matchedAgent = await this.agentService.findByPhoneNumberId(inboundPhoneNumberId);
          if (matchedAgent) {
            agentId = matchedAgent.id;
          }
        }

        if (!agentId) {
          agentId = this.configService.getOrThrow<string>('DEFAULT_AGENT_ID');
        }

        if (agentId) {
          await this.qualificationService.handleInbound(msg.from, msg.text, agentId);
        }
      };

      // Fire and forget — Meta requires immediate 200 response
      void processMessage();
    }
    return { status: 'ok' };
  }
}
