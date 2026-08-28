export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: string;
  name: string;
  agentId: string;
  templateMessage: string;
  status: CampaignStatus;
  totalContacts: number;
  sentCount: number;
  createdAt: Date;
  updatedAt: Date;
}
