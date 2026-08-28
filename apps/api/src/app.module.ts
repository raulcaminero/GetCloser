import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from './prisma/prisma.module.js';
import { AgentModule } from './agent/agent.module.js';
import { LeadsModule } from './leads/leads.module.js';
import { CampaignsModule } from './campaigns/campaigns.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    PrismaModule,
    AgentModule,
    LeadsModule,
    CampaignsModule,
  ],
})
export class AppModule {}
