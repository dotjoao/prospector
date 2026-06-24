export type LeadStatus =
  | 'Nao Contatado'
  | 'Mensagem Enviada'
  | 'Interessado'
  | 'Proposta Enviada'
  | 'Fechado'
  | 'Perdido';

export type Prioridade = 'Baixa' | 'Media' | 'Alta' | 'Muito Alta';

export type SiteStatus = 'Online' | 'Offline' | 'Timeout' | 'Sem Site';

export interface WebsiteAnalysis {
  siteStatus: SiteStatus;
  hasHttps: boolean;
  isResponsive: boolean;
  hasWhatsapp: boolean;
  hasForm: boolean;
  screenshotPath?: string;
  analyzedAt: string;
}

export interface Lead {
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
  googleMapsUrl: string;
  dataColeta: string;
  score: number;
  prioridade: Prioridade;
  status: LeadStatus;
  ultimoContato?: string;
  proximoFollowUp?: string;
  observacoes?: string;
  mensagemProspeccao?: string;
  websiteAnalysis?: WebsiteAnalysis;
}

export interface AppConfig {
  googlePlacesApiKey: string;
  defaultCity: string;
  defaultState: string;
  maxResults: number;
  topProspects: number;
  enableScreenshots: boolean;
}

export interface SearchParams {
  cidade: string;
  estado: string;
  categoria: string;
}

export interface LeadFilters {
  cidade?: string;
  categoria?: string;
  possuiSite?: boolean;
  scoreMinimo?: number;
  prioridade?: Prioridade;
  status?: LeadStatus;
  busca?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLeads {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalLeads: number;
  altaPrioridade: number;
  semSite: number;
  contatados: number;
  fechados: number;
}

export interface UpdateLeadPayload {
  status?: LeadStatus;
  ultimoContato?: string;
  proximoFollowUp?: string;
  observacoes?: string;
  mensagemProspeccao?: string;
}

export interface GooglePlaceResult {
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  types?: string[];
  place_id: string;
}

export interface FindOpportunitiesResult {
  leads: Lead[];
  totalFound: number;
  newLeads: number;
  topProspects: Lead[];
  message: string;
  warning?: string;
}
