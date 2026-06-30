export type LeadStatus =
  | 'Nao Contatado'
  | 'Mensagem Enviada'
  | 'Interessado'
  | 'Proposta Enviada'
  | 'Fechado'
  | 'Perdido';

export type Prioridade = 'Baixa' | 'Media' | 'Alta' | 'Muito Alta';

export type CityTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type LeadStrategyType = 'DIRECT' | 'INDIRECT' | 'AUTHORITY';

export type MessageVariant =
  | 'direct_google_focus'
  | 'direct_lead_generation'
  | 'indirect_value_focus'
  | 'indirect_positioning'
  | 'authority_social_proof';

export type SiteStatus = 'Online' | 'Offline' | 'Timeout' | 'Sem Site' | 'Instagram';

export interface WebsiteAnalysis {
  siteStatus: SiteStatus;
  hasHttps: boolean;
  isResponsive: boolean;
  hasWhatsapp: boolean;
  hasForm: boolean;
  hasInstagram?: boolean;
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
  siteScore?: number;
  cityTier?: CityTier;
  nicheIntentScore?: number;
  leadScoreFinal?: number;
  leadStrategyType?: LeadStrategyType;
  messageVariant?: MessageVariant;
  prioridade: Prioridade;
  status: LeadStatus;
  ultimoContato?: string;
  proximoFollowUp?: string;
  observacoes?: string;
  mensagemProspeccao?: string;
  websiteAnalysis?: WebsiteAnalysis;
}

export interface DashboardStats {
  totalLeads: number;
  altaPrioridade: number;
  semSite: number;
  contatados: number;
  fechados: number;
  leadsQuentes?: number;
  leadsMornos?: number;
  leadsFrios?: number;
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

export interface SearchParams {
  cidade: string;
  estado: string;
  categoria: string;
}

export interface FindOpportunitiesResult {
  leads: Lead[];
  totalFound: number;
  newLeads: number;
  topProspects: Lead[];
  message: string;
  warning?: string;
}

export interface AppConfig {
  googlePlacesApiKey: string;
  defaultCity: string;
  defaultState: string;
  maxResults: number;
  topProspects: number;
}
