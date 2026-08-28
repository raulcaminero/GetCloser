'use client';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { leadsApi } from '@/lib/api';
import { TemperatureBadge } from '@/components/temperature-badge';

type Lead = {
  id: string;
  phoneNumber: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  summary?: string;
  interestedIn?: string;
  lastMessageAt?: string;
  messageCount?: number;
};

const tabs = [
  { label: 'All', value: '' },
  { label: '🔥 Hot', value: 'HOT' },
  { label: '🟡 Warm', value: 'WARM' },
  { label: '❄️ Cold', value: 'COLD' },
];

export function LeadsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const temperature = searchParams.get('temperature') ?? '';

  const { data: leads = [], isLoading, isError } = useQuery<Lead[]>({
    queryKey: ['leads', temperature],
    queryFn: () => leadsApi.getAll(temperature ? { temperature } : undefined),
  });

  function setFilter(value: string) {
    const params = new URLSearchParams();
    if (value) params.set('temperature', value);
    router.push(`/leads${params.toString() ? `?${params.toString()}` : ''}`);
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-white">Leads</h1>
        {!isLoading && (
          <span className="bg-gray-800 text-gray-300 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {leads.length}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              temperature === tab.value
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-gray-400">Cargando...</p>}
      {isError && <p className="text-red-400">Error al cargar datos</p>}

      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <div key={lead.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <TemperatureBadge temperature={lead.temperature} />
                <span className="text-white font-medium">{lead.phoneNumber}</span>
                {lead.lastMessageAt && (
                  <span className="text-gray-500 text-sm">
                    {new Date(lead.lastMessageAt).toLocaleDateString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            </div>
            {lead.summary && (
              <p className="text-gray-400 text-sm line-clamp-2 mb-2">{lead.summary}</p>
            )}
            {lead.interestedIn && (
              <p className="text-gray-500 text-sm mb-3">
                Interested in: <span className="text-gray-300">{lead.interestedIn}</span>
              </p>
            )}
            <div className="flex justify-end">
              <Link
                href={`/leads/${lead.id}`}
                className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors"
              >
                Ver conversación →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
