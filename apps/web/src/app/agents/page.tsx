'use client';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { agentsApi } from '@/lib/api';

type Agent = {
  id: string;
  name: string;
  businessName: string;
  sector?: string;
  tone?: string;
  maxMessages?: number;
  isActive?: boolean;
  products?: unknown[];
  qualificationQuestions?: unknown[];
};

export default function AgentsPage() {
  const { data: agents = [], isLoading, isError } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: agentsApi.getAll,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <Link
          href="/agents/new"
          className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Agent
        </Link>
      </div>

      {isLoading && <p className="text-gray-400">Cargando...</p>}
      {isError && <p className="text-red-400">Error al cargar datos</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <div key={agent.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white font-semibold">{agent.name}</h2>
                <p className="text-gray-400 text-sm">{agent.businessName}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                  agent.isActive
                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                    : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                }`}
              >
                {agent.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              {agent.sector && (
                <span className="bg-gray-800 px-2 py-1 rounded">{agent.sector}</span>
              )}
              {agent.tone && (
                <span className="bg-gray-800 px-2 py-1 rounded">{agent.tone}</span>
              )}
            </div>

            <div className="text-sm text-gray-400 flex gap-4">
              {agent.products !== undefined && (
                <span>{agent.products.length} products</span>
              )}
              {agent.maxMessages !== undefined && (
                <span>Max {agent.maxMessages} messages</span>
              )}
            </div>

            <div className="flex justify-end mt-auto pt-2 border-t border-gray-800">
              <Link
                href={`/agents/${agent.id}/edit`}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
              >
                Edit →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
