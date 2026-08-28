import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { CampaignsService } from './campaigns.service.js';
import { CreateCampaignDto } from './dto/create-campaign.dto.js';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  findAll() {
    return this.campaignsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignsService.create(dto);
  }

  @Patch(':id/pause')
  pause(@Param('id') id: string) {
    return this.campaignsService.updateStatus(id, 'PAUSED');
  }

  @Patch(':id/resume')
  resume(@Param('id') id: string) {
    return this.campaignsService.updateStatus(id, 'ACTIVE');
  }
}
