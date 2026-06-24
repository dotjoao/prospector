import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Lead, AppConfig, WebsiteAnalysis } from '../types/index.js';

export interface LeadRow {
  id: string;
  empresa: string;
  categoria: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  website: string;
  nota: number;
  avaliacoes: number;
  google_maps_url: string;
  data_coleta: string;
  score: number;
  prioridade: string;
  status: string;
  ultimo_contato: string | null;
  proximo_follow_up: string | null;
  observacoes: string | null;
  mensagem_prospeccao: string | null;
  website_analysis: WebsiteAnalysis | null;
  created_at?: string;
  updated_at?: string;
}

export interface AppSettingsRow {
  id: number;
  google_places_api_key: string;
  default_city: string;
  default_state: string;
  max_results: number;
  top_prospects: number;
  enable_screenshots: boolean;
  updated_at?: string;
}

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseServiceKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && getSupabaseServiceKey());
}

/** @deprecated Use getPersistenceMode() / usesSupabase() após initPersistence() */
export function isSupabaseEnabled(): boolean {
  return isSupabaseConfigured();
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseEnabled()) {
    throw new Error(
      'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_SECRET_KEY) no backend/.env'
    );
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      getSupabaseServiceKey()!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    console.log('[Supabase] Cliente conectado');
  }

  return supabaseClient;
}

export function leadToRow(lead: Lead): Omit<LeadRow, 'created_at' | 'updated_at'> {
  return {
    id: lead.id,
    empresa: lead.empresa,
    categoria: lead.categoria,
    endereco: lead.endereco,
    cidade: lead.cidade,
    estado: lead.estado,
    telefone: lead.telefone,
    website: lead.website,
    nota: lead.nota,
    avaliacoes: lead.avaliacoes,
    google_maps_url: lead.googleMapsUrl,
    data_coleta: lead.dataColeta,
    score: lead.score,
    prioridade: lead.prioridade,
    status: lead.status,
    ultimo_contato: lead.ultimoContato?.split('T')[0] || null,
    proximo_follow_up: lead.proximoFollowUp?.split('T')[0] || null,
    observacoes: lead.observacoes || null,
    mensagem_prospeccao: lead.mensagemProspeccao || null,
    website_analysis: lead.websiteAnalysis || null,
  };
}

export function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    empresa: row.empresa,
    categoria: row.categoria,
    endereco: row.endereco,
    cidade: row.cidade,
    estado: row.estado,
    telefone: row.telefone,
    website: row.website,
    nota: Number(row.nota),
    avaliacoes: row.avaliacoes,
    googleMapsUrl: row.google_maps_url,
    dataColeta: row.data_coleta,
    score: row.score,
    prioridade: row.prioridade as Lead['prioridade'],
    status: row.status as Lead['status'],
    ultimoContato: row.ultimo_contato || undefined,
    proximoFollowUp: row.proximo_follow_up || undefined,
    observacoes: row.observacoes || undefined,
    mensagemProspeccao: row.mensagem_prospeccao || undefined,
    websiteAnalysis: row.website_analysis || undefined,
  };
}

export function settingsToConfig(row: AppSettingsRow): AppConfig {
  return {
    googlePlacesApiKey: row.google_places_api_key,
    defaultCity: row.default_city,
    defaultState: row.default_state,
    maxResults: row.max_results,
    topProspects: row.top_prospects,
    enableScreenshots: row.enable_screenshots,
  };
}

export function configToSettings(config: Partial<AppConfig>): Partial<AppSettingsRow> {
  const row: Partial<AppSettingsRow> = {};
  if (config.googlePlacesApiKey !== undefined) row.google_places_api_key = config.googlePlacesApiKey;
  if (config.defaultCity !== undefined) row.default_city = config.defaultCity;
  if (config.defaultState !== undefined) row.default_state = config.defaultState;
  if (config.maxResults !== undefined) row.max_results = config.maxResults;
  if (config.topProspects !== undefined) row.top_prospects = config.topProspects;
  if (config.enableScreenshots !== undefined) row.enable_screenshots = config.enableScreenshots;
  return row;
}
