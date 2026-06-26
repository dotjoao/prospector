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
import { getAuthToken } from '@/lib/auth-token';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const REQUEST_TIMEOUT_MS = 45000;

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  return apiOrigin ? `${apiOrigin}${path}` : path;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      let message = `Erro HTTP ${response.status}`;
      try {
        const error = JSON.parse(text) as { error?: string };
        message = error.error || message;
      } catch {
        if (text.includes('Cannot DELETE')) {
          message = 'Backend desatualizado — faça redeploy no Render.';
        } else if (text.trim()) {
          message = text.slice(0, 200);
        }
      }
      throw new Error(message);
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(
        'Servidor não respondeu a tempo. O backend no Render pode estar iniciando — aguarde 1 minuto e tente novamente.'
      );
    }
    if (err instanceof TypeError) {
      throw new Error(
        'Não foi possível conectar à API. Verifique se o backend está online no Render.'
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: { username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getMe: (token?: string) =>
    request<{ user: { username: string } }>('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  logout: (token?: string) =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

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

  clearAllLeads: () =>
    request<{ success: boolean; count: number }>('/leads', { method: 'DELETE' }),

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
