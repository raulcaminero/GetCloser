import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
});

export const leadsApi = {
  getAll: (params?: { temperature?: string; agentId?: string }) =>
    api.get('/leads', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/leads/${id}`).then(r => r.data),
  getConversation: (id: string) => api.get(`/leads/${id}/conversation`).then(r => r.data),
  sendMessage: (id: string, content: string) => api.post(`/leads/${id}/messages`, { content }).then(r => r.data),
};

export const agentsApi = {
  getAll: () => api.get('/agents').then(r => r.data),
  getById: (id: string) => api.get(`/agents/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/agents', data).then(r => r.data),
  update: (id: string, data: unknown) => api.patch(`/agents/${id}`, data).then(r => r.data),
  remove: (id: string) => api.delete(`/agents/${id}`),
};

export const campaignsApi = {
  getAll: () => api.get('/campaigns').then(r => r.data),
  getById: (id: string) => api.get(`/campaigns/${id}`).then(r => r.data),
  create: (data: unknown) => api.post('/campaigns', data).then(r => r.data),
  pause: (id: string) => api.patch(`/campaigns/${id}/pause`).then(r => r.data),
  resume: (id: string) => api.patch(`/campaigns/${id}/resume`).then(r => r.data),
};
