import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LeadsService } from '../leads/leads.service.js';
import { AgentService } from './agent.service.js';
import { WhatsAppService } from '../whatsapp/whatsapp.service.js';

@Injectable()
export class QualificationService {
  private readonly logger = new Logger(QualificationService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly leadsService: LeadsService,
    private readonly agentService: AgentService,
    private readonly whatsappService: WhatsAppService,
    private readonly configService: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async handleInbound(phone: string, text: string, agentId: string): Promise<void> {
    try {
      const agent = await this.agentService.findOne(agentId);
      const lead = await this.leadsService.findOrCreate(phone, agentId);
      await this.leadsService.addMessage(lead.id, 'CUSTOMER', text);

      const updatedLead = await this.leadsService.findById(lead.id);
      if (!updatedLead) return;

      if (updatedLead.messageCount >= agent.maxMessages) {
        await this.generateHandoffSummary(lead.id, agent);
        return;
      }

      const history = await this.leadsService.getConversation(lead.id);
      const systemPrompt = this.buildSystemPrompt(agent);
      const messages = history.map((m: { role: string; content: string }) => ({
        role: m.role === 'AGENT' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        system: systemPrompt,
        messages,
      });

      const reply = (response.content[0] as { type: string; text: string }).text;
      await this.leadsService.addMessage(lead.id, 'AGENT', reply);
      await this.whatsappService.sendMessage(phone, reply, {
        phoneNumberId: agent.whatsappPhoneNumberId,
        accessToken: agent.whatsappAccessToken,
      });

      const last5 = history.slice(-5);
      await this.classifyLead(lead.id, last5, agent.products);
    } catch (error) {
      this.logger.error(`Failed to handle inbound from ${phone}`, error);
    }
  }

  private buildSystemPrompt(agent: {
    name: string;
    businessName: string;
    sector: string;
    tone: string;
    qualificationQuestions: string[];
    handoffMessage: string;
    products: Array<{ id: string; name: string; price: string; features: string; zone?: string | null }>;
  }): string {
    const productsList = agent.products
      .map((p) => `- ${p.name}: ${p.price} — ${p.features}${p.zone ? ` (${p.zone})` : ''}`)
      .join('\n');

    const questionsList = agent.qualificationQuestions
      .map((q, i) => `${i + 1}. ${q}`)
      .join('\n');

    return `You are ${agent.name}, a sales assistant for ${agent.businessName}.
Sector: ${agent.sector}
Tone: ${agent.tone}

Your goal is to qualify leads by asking key questions naturally in conversation.
Keep responses short (2-3 sentences max). Be conversational, not robotic.

Key questions to naturally weave into the conversation:
${questionsList}

Products you can offer (mention only when relevant):
${productsList}

Rules:
- Never ask more than one question at a time
- If the customer shows interest in a product, mention it naturally
- After gathering enough info, say: "${agent.handoffMessage}"
- Respond in the same language the customer writes in`;
  }

  private async classifyLead(
    leadId: string,
    recentMessages: Array<{ role: string; content: string }>,
    products: Array<{ id: string; name: string }>,
  ): Promise<void> {
    const productsList = products.map((p) => `- id: ${p.id}, name: ${p.name}`).join('\n');
    const conversation = recentMessages
      .map((m: { role: string; content: string }) => `${m.role === 'AGENT' ? 'Agent' : 'Customer'}: ${m.content}`)
      .join('\n');

    const prompt = `Based on this conversation, classify the lead temperature.
Reply with JSON only: { "temperature": "HOT" | "WARM" | "COLD", "interestedProductId": "product_id or null", "reasoning": "one sentence" }

HOT = ready to buy or book, specific interest shown
WARM = interested but not urgent
COLD = just browsing, no clear intent

Products available:
${productsList}

Conversation:
${conversation}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]) as {
      temperature: 'HOT' | 'WARM' | 'COLD';
      interestedProductId: string | null;
      reasoning: string;
    };

    await this.leadsService.updateLeadAfterConversation(leadId, {
      temperature: parsed.temperature,
      summary: parsed.reasoning,
      interestedProductId: parsed.interestedProductId ?? undefined,
    });
  }

  private async generateHandoffSummary(
    leadId: string,
    agent: {
      handoffMessage: string;
      whatsappPhoneNumberId?: string | null;
      whatsappAccessToken?: string | null;
      products: Array<{ id: string; name: string }>;
    },
  ): Promise<void> {
    const history = await this.leadsService.getConversation(leadId);
    const lead = await this.leadsService.findById(leadId);
    if (!lead) return;

    const productsList = agent.products.map((p) => `- id: ${p.id}, name: ${p.name}`).join('\n');
    const conversation = history
      .map((m: { role: string; content: string }) => `${m.role === 'AGENT' ? 'Agent' : 'Customer'}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize this lead qualification conversation in 2-3 sentences for a sales agent.
Include: what they're looking for, budget if mentioned, timeline, and buying intent.
Reply with JSON only: { "summary": "...", "temperature": "HOT" | "WARM" | "COLD", "interestedProductId": "id or null" }

Products:
${productsList}

Conversation:
${conversation}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = (response.content[0] as { type: string; text: string }).text;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary: string;
      temperature: 'HOT' | 'WARM' | 'COLD';
      interestedProductId: string | null;
    };

    await this.leadsService.updateLeadAfterConversation(leadId, {
      temperature: parsed.temperature,
      summary: parsed.summary,
      interestedProductId: parsed.interestedProductId ?? undefined,
      handedOff: true,
      handedOffAt: new Date(),
    });

    await this.whatsappService.sendMessage(lead.phone, agent.handoffMessage, {
      phoneNumberId: agent.whatsappPhoneNumberId,
      accessToken: agent.whatsappAccessToken,
    });
  }
}
