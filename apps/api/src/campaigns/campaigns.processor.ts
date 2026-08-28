import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';
import { WhatsAppService } from '../whatsapp/whatsapp.service.js';
import { LeadsService } from '../leads/leads.service.js';

@Processor('campaigns')
export class CampaignsProcessor {
  private readonly logger = new Logger(CampaignsProcessor.name);

  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly whatsappService: WhatsAppService,
    private readonly leadsService: LeadsService,
  ) {}

  @Process('send-bulk')
  async handleSendBulk(job: Job<{ campaignId: string; agentId: string; templateMessage: string; phoneNumbers: string[] }>) {
    const { campaignId, agentId, templateMessage, phoneNumbers } = job.data;
    await this.campaignsService.updateStatus(campaignId, 'ACTIVE');

    for (const phone of phoneNumbers) {
      try {
        await this.leadsService.findOrCreate(phone, agentId, campaignId);
        await this.whatsappService.sendMessage(phone, templateMessage);
        await this.leadsService.addMessage(
          (await this.leadsService.findOrCreate(phone, agentId, campaignId)).id,
          'AGENT',
          templateMessage,
        );
        await this.campaignsService.incrementSent(campaignId);
        // 1 second delay between messages to respect Meta rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        this.logger.error(`Failed to send to ${phone}`, err);
      }
    }

    await this.campaignsService.updateStatus(campaignId, 'COMPLETED');
  }
}
