'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { use, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { leadsApi } from '@/lib/api';
import { TemperatureBadge } from '@/components/temperature-badge';

type Lead = {
  id: string;
  phoneNumber?: string;
  phone?: string;
  temperature: 'HOT' | 'WARM' | 'COLD';
  summary?: string;
  interestedIn?: string;
  handedOff?: boolean;
};

type Message = {
  id: string;
  role: 'AGENT' | 'CUSTOMER';
  content: string;
  createdAt?: string;
  sentAt?: string;
};

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: lead, isLoading: leadLoading, isError: leadError } = useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.getById(id),
  });

  const { data: messages = [], isLoading: convoLoading, isError: convoError } = useQuery<Message[]>({
    queryKey: ['conversation', id],
    queryFn: () => leadsApi.getConversation(id),
    refetchInterval: 3000, // Poll every 3 seconds for live inbound responses
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || submitting) return;

    setSubmitting(true);
    try {
      await leadsApi.sendMessage(id, replyText.trim());
      setReplyText('');
      await queryClient.invalidateQueries({ queryKey: ['conversation', id] });
      await queryClient.invalidateQueries({ queryKey: ['lead', id] });
    } catch {
      alert('Error al enviar mensaje por WhatsApp');
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = leadLoading || convoLoading;
  const isError = leadError || convoError;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <Link href="/leads" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to Leads
        </Link>
      </div>

      {isLoading && <p className="text-gray-400">Cargando...</p>}
      {isError && <p className="text-red-400">Error al cargar datos</p>}

      {lead && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <TemperatureBadge temperature={lead.temperature} />
            <span className="text-white font-semibold text-lg">{lead.phoneNumber || lead.phone}</span>
            {lead.handedOff ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                Handed Off
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-300 border border-violet-500/30">
                AI Handling
              </span>
            )}
          </div>
          {lead.summary && (
            <p className="text-gray-300 text-sm mb-1">{lead.summary}</p>
          )}
          {lead.interestedIn && (
            <p className="text-gray-400 text-xs">
              Interested in: <span className="text-gray-200">{lead.interestedIn}</span>
            </p>
          )}
        </div>
      )}

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
        {messages.map((msg) => {
          const dateStr = msg.createdAt || msg.sentAt;
          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'CUSTOMER' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                  msg.role === 'CUSTOMER'
                    ? 'bg-gray-800 text-gray-100 rounded-tl-sm'
                    : 'bg-violet-600 text-white rounded-tr-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {dateStr && (
                  <p className={`text-[10px] mt-1 ${msg.role === 'CUSTOMER' ? 'text-gray-400' : 'text-violet-200'}`}>
                    {new Date(dateStr).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Live Chat Takeover Input Bar */}
      <form onSubmit={handleSendMessage} className="shrink-0 bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-2">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Escribe un mensaje por WhatsApp para tomar el control..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm"
        />
        <button
          type="submit"
          disabled={submitting || !replyText.trim()}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {submitting ? 'Enviando...' : 'Enviar WhatsApp'}
        </button>
      </form>
    </div>
  );
}
