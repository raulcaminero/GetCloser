export type LeadTemperature = 'hot' | 'warm' | 'cold';

export interface Lead {
  id: string;
  phone: string;
  name?: string;
  agentId: string;
  campaignId?: string;
  temperature: LeadTemperature;
  messageCount: number;
  summary: string;
  interestedProductId?: string;
  handedOff: boolean;
  handedOffAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationMessage {
  id: string;
  leadId: string;
  role: 'agent' | 'customer';
  content: string;
  sentAt: Date;
}
