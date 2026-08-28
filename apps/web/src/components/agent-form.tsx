'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentsApi } from '@/lib/api';

type Product = {
  name: string;
  price: string;
  features: string;
  zone: string;
};

type AgentFormData = {
  name: string;
  businessName: string;
  sector: string;
  tone: string;
  maxMessages: number;
  handoffMessage: string;
  isActive: boolean;
  qualificationQuestions: string[];
  products: Product[];
};

const defaultForm: AgentFormData = {
  name: '',
  businessName: '',
  sector: '',
  tone: '',
  maxMessages: 20,
  handoffMessage: '',
  isActive: true,
  qualificationQuestions: [],
  products: [],
};

export function AgentForm({ agentId, initial }: { agentId?: string; initial?: Partial<AgentFormData> }) {
  const router = useRouter();
  const [form, setForm] = useState<AgentFormData>({ ...defaultForm, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function setField<K extends keyof AgentFormData>(key: K, value: AgentFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function addQuestion() {
    setField('qualificationQuestions', [...form.qualificationQuestions, '']);
  }

  function setQuestion(i: number, value: string) {
    const updated = [...form.qualificationQuestions];
    updated[i] = value;
    setField('qualificationQuestions', updated);
  }

  function removeQuestion(i: number) {
    setField('qualificationQuestions', form.qualificationQuestions.filter((_, idx) => idx !== i));
  }

  function addProduct() {
    setField('products', [...form.products, { name: '', price: '', features: '', zone: '' }]);
  }

  function setProduct(i: number, key: keyof Product, value: string) {
    const updated = [...form.products];
    updated[i] = { ...updated[i], [key]: value };
    setField('products', updated);
  }

  function removeProduct(i: number) {
    setField('products', form.products.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (agentId) {
        await agentsApi.update(agentId, form);
      } else {
        await agentsApi.create(form);
      }
      router.push('/agents');
    } catch {
      setError('Error al guardar agente');
      setSubmitting(false);
    }
  }

  const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 text-sm';
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={form.name} onChange={e => setField('name', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Business Name</label>
          <input className={inputClass} value={form.businessName} onChange={e => setField('businessName', e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Sector</label>
          <input className={inputClass} value={form.sector} onChange={e => setField('sector', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Tone</label>
          <input className={inputClass} value={form.tone} onChange={e => setField('tone', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Max Messages</label>
          <input
            type="number"
            className={inputClass}
            value={form.maxMessages}
            min={1}
            onChange={e => setField('maxMessages', Number(e.target.value))}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={e => setField('isActive', e.target.checked)}
            className="w-4 h-4 accent-violet-600"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-300">Active</label>
        </div>
      </div>

      <div>
        <label className={labelClass}>Handoff Message</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          value={form.handoffMessage}
          onChange={e => setField('handoffMessage', e.target.value)}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Qualification Questions</label>
          <button type="button" onClick={addQuestion} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {form.qualificationQuestions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                value={q}
                onChange={e => setQuestion(i, e.target.value)}
                placeholder={`Question ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-gray-500 hover:text-red-400 px-2 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelClass}>Products</label>
          <button type="button" onClick={addProduct} className="text-violet-400 hover:text-violet-300 text-sm font-medium">
            + Add
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {form.products.map((p, i) => (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-300 text-sm font-medium">Product {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(i)}
                  className="text-gray-500 hover:text-red-400 text-sm transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Name</label>
                  <input className={inputClass} value={p.name} onChange={e => setProduct(i, 'name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Price</label>
                  <input className={inputClass} value={p.price} onChange={e => setProduct(i, 'price', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Features</label>
                  <input className={inputClass} value={p.features} onChange={e => setProduct(i, 'features', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Zone (optional)</label>
                  <input className={inputClass} value={p.zone} onChange={e => setProduct(i, 'zone', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          {submitting ? 'Guardando...' : agentId ? 'Save Changes' : 'Create Agent'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/agents')}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
