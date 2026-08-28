'use client';
import { useQuery } from '@tanstack/react-query';
import { use } from 'react';
import Link from 'next/link';
import { leadsApi } from '@/lib/api';
import { TemperatureBadge } from '@/components/temperature-badge';

type Lead = {
  id: string;
  phoneNumber: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  summary?: string;
  interestedIn?: string;
  handedOff?: boolean;
};

type Message = {
  id: string;
  role: 'AGENT' | 'CUSTOMER';
  content: string;
  createdAt: string;
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: lead, isLoading: leadLoading, isError: leadError } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getById(id),
  });

  const { data: messages = [], isLoading: convoLoading, isError: convoError } = useQuery<Message[]>({
    queryKey: ['conversation', id],
    queryFn: () => leadsApi.getConversation(id),
  });

  const isLoading = leadLoading || convoLoading;
  const isError = leadError || convoError;

  return (
    <div>
      <div className="mb-6">
        <Link href="/leads" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to Leads
        </Link>
      </div>

      {isLoading && <p className="text-gray-400">Cargando...</p>}
      {isError && <p className="text-red-400">Error al cargar datos</p>}

      {lead && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <TemperatureBadge temperature={lead.temperature} />
            <span className="text-white font-semibold text-lg">{lead.phoneNumber}</span>
            {lead.handedOff && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                Handed Off
              </span>
            )}
          </div>
          {lead.summary && (
            <p className="text-gray-400 text-sm mb-1">{lead.summary}</p>
          )}
          {lead.interestedIn && (
            <p className="text-gray-500 text-sm">
              Interested in: <span className="text-gray-300">{lead.interestedIn}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === 'AGENT'
                  ? 'bg-gray-800 text-gray-100 rounded-tl-sm'
                  : 'bg-violet-600 text-white rounded-tr-sm'
              }`}
            >
              <p>{msg.content}</p>
              <p className={`text-xs mt-1 ${msg.role === 'AGENT' ? 'text-gray-500' : 'text-violet-300'}`}>
                {new Date(msg.createdAt).toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
