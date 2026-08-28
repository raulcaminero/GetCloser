import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';

type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('campaigns') private readonly campaignsQueue: Queue,
  ) {}

  findAll() {
    return this.prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { agent: { select: { name: true } } },
    });
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { agent: { select: { name: true } } },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return campaign;
  }

  async create(dto: CreateCampaignDto) {
    const campaign = await this.prisma.campaign.create({
      data: {
        name: dto.name,
        agentId: dto.agentId,
        templateMessage: dto.templateMessage,
        totalContacts: dto.phoneNumbers.length,
        status: 'DRAFT',
      },
    });

    await this.campaignsQueue.add('send-bulk', {
      campaignId: campaign.id,
      agentId: dto.agentId,
      templateMessage: dto.templateMessage,
      phoneNumbers: dto.phoneNumbers,
    });

    return campaign;
  }

  async updateStatus(id: string, status: CampaignStatus) {
    return this.prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async incrementSent(id: string) {
    return this.prisma.campaign.update({
      where: { id },
      data: { sentCount: { increment: 1 } },
    });
  }
}
