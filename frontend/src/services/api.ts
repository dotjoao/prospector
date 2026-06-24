import {
  Lead,
  LeadFilters,
  PaginatedLeads,
  DashboardStats,
  SearchParams,
  FindOpportunitiesResult,
  AppConfig,
  LeadStatus,
} from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  getHealth: () => request<{ status: string; storage: 'supabase' | 'json' }>('/health'),

  getDashboard: () => request<DashboardStats>('/dashboard'),

  getLeads: (filters?: LeadFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.set(key, String(value));
        }
      });
    }
    const query = params.toString();
    return request<PaginatedLeads>(`/leads${query ? `?${query}` : ''}`);
  },

  getLead: (id: string) => request<Lead>(`/leads/${id}`),

  updateLead: (id: string, data: Partial<Lead>) =>
    request<Lead>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLead: (id: string) =>
    request<{ success: boolean }>(`/leads/${id}`, { method: 'DELETE' }),

  findOpportunities: (params: SearchParams) =>
    request<FindOpportunitiesResult>('/opportunities/find', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  generateMessage: (id: string) =>
    request<{ message: string }>(`/leads/${id}/message`),

  getExportCategories: () =>
    request<{ name: string; count: number }[]>('/export/categories'),

  exportExcel: (categoria?: string) =>
    request<{
      success: boolean;
      fileName: string;
      downloadUrl: string;
      count: number;
      categoria: string | null;
    }>('/export/excel', {
      method: 'POST',
      body: JSON.stringify(categoria ? { categoria } : {}),
    }),

  exportAllThemes: () =>
    request<{
      success: boolean;
      totalThemes: number;
      exports: { fileName: string; count: number; downloadUrl: string }[];
    }>('/export/excel/all-themes', { method: 'POST' }),

  getConfig: () => request<AppConfig>('/config'),

  updateConfig: (config: Partial<AppConfig>) =>
    request<AppConfig>('/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
};

export const LEAD_STATUSES: LeadStatus[] = [
  'Nao Contatado',
  'Mensagem Enviada',
  'Interessado',
  'Proposta Enviada',
  'Fechado',
  'Perdido',
];

export const PRIORIDADES = ['Baixa', 'Media', 'Alta', 'Muito Alta'] as const;

export const ESTADOS_BR = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];
