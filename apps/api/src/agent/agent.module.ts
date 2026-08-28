import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller.js';
import { AgentService } from './agent.service.js';
import { QualificationService } from './qualification.service.js';
import { LeadsModule } from '../leads/leads.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
import { WhatsAppController } from '../whatsapp/whatsapp.controller.js';

@Module({
  imports: [LeadsModule, WhatsAppModule],
  controllers: [AgentController, WhatsAppController],
  providers: [AgentService, QualificationService],
  exports: [AgentService, QualificationService],
})
export class AgentModule {}
