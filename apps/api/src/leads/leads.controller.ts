import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { LeadsService } from './leads.service.js';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(@Query('temperature') temperature?: string, @Query('agentId') agentId?: string) {
    return this.leadsService.findAll({ temperature, agentId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const lead = await this.leadsService.findById(id);
    if (!lead) throw new NotFoundException(`Lead ${id} not found`);
    return lead;
  }

  @Get(':id/conversation')
  getConversation(@Param('id') id: string) {
    return this.leadsService.getConversation(id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.leadsService.sendHumanMessage(id, body.content);
  }
}
