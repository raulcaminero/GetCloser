import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAgentDto } from './dto/create-agent.dto.js';
import { UpdateAgentDto } from './dto/update-agent.dto.js';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.agent.findMany({
      include: { products: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return agent;
  }

  async findByPhoneNumberId(phoneNumberId: string) {
    return this.prisma.agent.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId, isActive: true },
      include: { products: true },
    });
  }

  create(dto: CreateAgentDto) {
    const { products, ...agentData } = dto;
    return this.prisma.agent.create({
      data: {
        ...agentData,
        products: {
          create: products,
        },
      },
      include: { products: true },
    });
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);

    const { products, ...agentData } = dto as UpdateAgentDto & { products?: { name: string; price: string; features: string; zone?: string; imageUrl?: string }[] };

    return this.prisma.agent.update({
      where: { id },
      data: {
        ...agentData,
        ...(products !== undefined && {
          products: {
            deleteMany: {},
            createMany: { data: products },
          },
        }),
      },
      include: { products: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agent.delete({ where: { id } });
  }
}
