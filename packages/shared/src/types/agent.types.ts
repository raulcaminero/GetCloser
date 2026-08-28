export interface CatalogProduct {
  id: string;
  name: string;
  price: string;
  features: string;
  zone?: string;
  imageUrl?: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  businessName: string;
  sector: string;
  tone: string;
  qualificationQuestions: string[];
  maxMessages: number;
  handoffMessage: string;
  products: CatalogProduct[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAgentDto = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>;
