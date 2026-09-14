import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WhatsAppService } from '../whatsapp/whatsapp.service.js';

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async sendHumanMessage(leadId: string, content: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { agent: true },
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${leadId} not found`);
    }

    // Send to customer on WhatsApp
    await this.whatsappService.sendMessage(lead.phone, content, {
      phoneNumberId: lead.agent.whatsappPhoneNumberId,
      accessToken: lead.agent.whatsappAccessToken,
    });

    // Save message and mark lead handed off
    const msg = await this.addMessage(leadId, 'AGENT', content);

    await this.prisma.lead.update({
      where: { id: leadId },
      data: {
        handedOff: true,
        handedOffAt: lead.handedOffAt ?? new Date(),
      },
    });

    return msg;
  }

  async findOrCreate(phone: string, agentId: string, campaignId?: string) {
    return this.prisma.lead.upsert({
      where: { phone_agentId: { phone, agentId } },
      create: { phone, agentId, ...(campaignId ? { campaignId } : {}) },
      update: {},
      include: { interestedProduct: true },
    });
  }

  getConversation(leadId: string) {
    return this.prisma.conversationMessage.findMany({
      where: { leadId },
      orderBy: { sentAt: 'asc' },
    });
  }

  async addMessage(leadId: string, role: 'AGENT' | 'CUSTOMER', content: string) {
    const [message] = await this.prisma.$transaction([
      this.prisma.conversationMessage.create({
        data: { leadId, role, content },
      }),
      this.prisma.lead.update({
        where: { id: leadId },
        data: { messageCount: { increment: 1 } },
      }),
    ]);
    return message;
  }

  async updateLeadAfterConversation(
    leadId: string,
    data: {
      temperature: 'HOT' | 'WARM' | 'COLD';
      summary: string;
      interestedProductId?: string;
      handedOff?: boolean;
      handedOffAt?: Date;
    },
  ) {
    return this.prisma.lead.update({
      where: { id: leadId },
      data: {
        temperature: data.temperature,
        summary: data.summary,
        ...(data.interestedProductId !== undefined && {
          interestedProductId: data.interestedProductId,
        }),
        ...(data.handedOff !== undefined && { handedOff: data.handedOff }),
        ...(data.handedOffAt !== undefined && { handedOffAt: data.handedOffAt }),
      },
    });
  }

  findAll(filters?: { temperature?: string; agentId?: string }) {
    return this.prisma.lead.findMany({
      where: {
        ...(filters?.temperature && {
          temperature: filters.temperature.toUpperCase() as 'HOT' | 'WARM' | 'COLD',
        }),
        ...(filters?.agentId && { agentId: filters.agentId }),
      },
      include: {
        interestedProduct: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: { interestedProduct: true },
    });
  }
}
