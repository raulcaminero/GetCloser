'use client';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api';
import { AgentForm } from '@/components/agent-form';

type AgentData = {
  id: string;
  name?: string;
  businessName?: string;
  sector?: string;
  tone?: string;
  maxMessages?: number;
  handoffMessage?: string;
  isActive?: boolean;
  qualificationQuestions?: string[];
  products?: Array<{ name: string; price: string; features: string; zone: string }>;
};

export default function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: agent, isLoading, isError } = useQuery<AgentData>({
    queryKey: ['agent', id],
    queryFn: () => agentsApi.getById(id),
  });

  if (isLoading) return <p className="text-gray-400">Cargando...</p>;
  if (isError) return <p className="text-red-400">Error al cargar datos</p>;
  if (!agent) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Edit Agent</h1>
      <AgentForm
        agentId={id}
        initial={{
          name: agent.name ?? '',
          businessName: agent.businessName ?? '',
          sector: agent.sector ?? '',
          tone: agent.tone ?? '',
          maxMessages: agent.maxMessages ?? 20,
          handoffMessage: agent.handoffMessage ?? '',
          isActive: agent.isActive ?? true,
          qualificationQuestions: agent.qualificationQuestions ?? [],
          products: agent.products ?? [],
        }}
      />
    </div>
  );
}
