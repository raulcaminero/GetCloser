'use client';

import { useState, useEffect, useRef } from 'react';
import { campaignsApi, agentsApi } from '@/lib/api';

type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  sentCount: number;
  totalContacts: number;
  createdAt: string;
  agent: { name: string };
}

interface Agent {
  id: string;
  name: string;
}

const STATUS_BADGE: Record<CampaignStatus, { label: string; className: string; dot?: boolean }> = {
  DRAFT: { label: 'DRAFT', className: 'bg-gray-700 text-gray-300' },
  ACTIVE: { label: 'ACTIVE', className: 'bg-blue-900 text-blue-300', dot: true },
  PAUSED: { label: 'PAUSED', className: 'bg-amber-900 text-amber-300' },
  COMPLETED: { label: 'COMPLETED', className: 'bg-green-900 text-green-300' },
};

function StatusBadge({ status }: { status: CampaignStatus }) {
  const cfg = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
      )}
      {cfg.label}
    </span>
  );
}

function CampaignCard({ campaign, onPause, onResume }: { campaign: Campaign; onPause: () => void; onResume: () => void }) {
  const pct = campaign.totalContacts > 0
    ? Math.round((campaign.sentCount / campaign.totalContacts) * 100)
    : 0;

  const date = new Date(campaign.createdAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">{campaign.name}</h3>
          <p className="text-sm text-gray-400 mt-0.5">Agent: {campaign.agent.name}</p>
        </div>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Progress</span>
          <span>{campaign.sentCount}/{campaign.totalContacts} sent</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className="bg-violet-500 h-1.5 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Created: {date}</p>
        <div className="flex gap-2">
          {campaign.status === 'ACTIVE' && (
            <button
              onClick={onPause}
              className="text-xs px-3 py-1 rounded-lg border border-amber-700 text-amber-400 hover:bg-amber-900/30 transition-colors"
            >
              Pause
            </button>
          )}
          {campaign.status === 'PAUSED' && (
            <button
              onClick={onResume}
              className="text-xs px-3 py-1 rounded-lg border border-blue-700 text-blue-400 hover:bg-blue-900/30 transition-colors"
            >
              Resume
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignsList({ refresh }: { refresh: number }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    campaignsApi.getAll().then(setCampaigns).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [refresh]);

  const handlePause = (id: string) => {
    campaignsApi.pause(id).then(load);
  };

  const handleResume = (id: string) => {
    campaignsApi.resume(id).then(load);
  };

  if (loading) return <p className="text-gray-400 text-sm">Loading campaigns...</p>;
  if (campaigns.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-12">
        No campaigns yet. Create one to get started.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.map(c => (
        <CampaignCard
          key={c.id}
          campaign={c}
          onPause={() => handlePause(c.id)}
          onResume={() => handleResume(c.id)}
        />
      ))}
    </div>
  );
}

function NewCampaignForm({ onCreated }: { onCreated: () => void }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [templateMessage, setTemplateMessage] = useState('');
  const [numbersText, setNumbersText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    agentsApi.getAll().then((data: Agent[]) => {
      setAgents(data);
      if (data.length > 0) setAgentId(data[0].id);
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string ?? '';
      const lines = raw.split(/[\r\n,;]+/).map(l => l.replace(/\D/g, '')).filter(Boolean);
      setNumbersText(lines.join('\n'));
    };
    reader.readAsText(file);
  };

  const parseNumbers = (): string[] =>
    numbersText
      .split(/[\r\n]+/)
      .map(l => l.replace(/\D/g, ''))
      .filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const phoneNumbers = parseNumbers();
    if (phoneNumbers.length === 0) {
      setError('Enter at least one phone number.');
      return;
    }
    if (!agentId) {
      setError('Select an agent.');
      return;
    }
    setSubmitting(true);
    try {
      await campaignsApi.create({ name, agentId, templateMessage, phoneNumbers });
      setName('');
      setTemplateMessage('');
      setNumbersText('');
      if (fileRef.current) fileRef.current.value = '';
      onCreated();
    } catch {
      setError('Failed to create campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">Campaign name</label>
        <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Summer promo 2026"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">Agent</label>
        <select
          required
          value={agentId}
          onChange={e => setAgentId(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {agents.length === 0 && <option value="">No agents found</option>}
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">Template message</label>
        <p className="text-xs text-gray-500">This is the first message sent to each contact.</p>
        <textarea
          required
          rows={4}
          value={templateMessage}
          onChange={e => setTemplateMessage(e.target.value)}
          placeholder="Hi! I'm reaching out about..."
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-300">Phone numbers</label>
        <p className="text-xs text-gray-500">One number per line, or upload a CSV file.</p>
        <textarea
          rows={6}
          value={numbersText}
          onChange={e => setNumbersText(e.target.value)}
          placeholder={'+15551234567\n+15559876543'}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono text-sm"
        />
        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-sm text-violet-400 hover:text-violet-300 transition-colors">
            Upload CSV
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
          {numbersText && (
            <span className="text-xs text-gray-500">{parseNumbers().length} numbers</span>
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {submitting ? 'Launching...' : 'Launch campaign'}
      </button>
    </form>
  );
}

export default function CampaignsPage() {
  const [tab, setTab] = useState<'list' | 'new'>('list');
  const [refresh, setRefresh] = useState(0);

  const handleCreated = () => {
    setTab('list');
    setRefresh(r => r + 1);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Campaigns</h1>

      <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {(['list', 'new'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-violet-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'list' ? 'Campaigns' : 'New Campaign'}
          </button>
        ))}
      </div>

      {tab === 'list' && <CampaignsList refresh={refresh} />}
      {tab === 'new' && <NewCampaignForm onCreated={handleCreated} />}
    </div>
  );
}
