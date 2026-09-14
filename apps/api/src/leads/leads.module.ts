import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service.js';
import { LeadsController } from './leads.controller.js';

import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';

@Module({
  imports: [WhatsAppModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
