import { Lead, Prioridade } from '../types/index.js';
import { calculateScore } from '../utils/score.js';
import { getDigitalPresence, isInstagramOnlyLead, resolveSiteStatusForScoring } from './lead-presence.js';

export type CityTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type LeadStrategyType = 'DIRECT' | 'INDIRECT' | 'AUTHORITY';
export type MessageVariant =
  | 'direct_google_focus'
  | 'direct_lead_generation'
  | 'indirect_value_focus'
  | 'indirect_positioning'
  | 'authority_social_proof';

export interface StrategyProfile {
  cityTier: CityTier;
  nicheIntentScore: number;
  siteScore: number;
  cityTierWeight: number;
  leadScoreFinal: number;
  leadStrategyType: LeadStrategyType;
  messageVariant: MessageVariant;
  prioridade: Prioridade;
}

const TIER_1_CITIES = new Set([
  'sao paulo', 'rio de janeiro', 'brasilia', 'belo horizonte', 'curitiba',
  'porto alegre', 'florianopolis', 'balneario camboriu', 'goiania', 'campinas',
  'santos', 'sorocaba', 'ribeirao preto', 'sao jose dos campos', 'natal',
  'recife', 'salvador', 'fortaleza', 'manaus', 'vitoria',
]);

const TIER_2_CITIES = new Set([
  'cuiaba', 'varzea grande', 'rondonopolis', 'sinop', 'tangara da serra',
  'londrina', 'maringa', 'cascavel', 'foz do iguacu', 'joinville',
  'blumenau', 'chapeco', 'uberlandia', 'juiz de fora', 'sao luis',
  'joao pessoa', 'maceio', 'teresina', 'campo grande', 'petropolis',
]);

const NICHE_INTENT: { keywords: string[]; score: number }[] = [
  { keywords: ['dentist', 'odontolog', 'ortodont'], score: 100 },
  { keywords: ['estetic', 'harmonizacao', 'botox', 'fillers'], score: 95 },
  { keywords: ['psicolog', 'terapia', 'psiquiatr'], score: 90 },
  { keywords: ['advogad', 'juridic', 'escritorio de advocacia'], score: 90 },
  { keywords: ['dermatolog', 'dermato'], score: 90 },
  { keywords: ['nutricion', 'nutrolog'], score: 70 },
  { keywords: ['personal trainer', 'personal', 'academia', 'crossfit'], score: 60 },
  { keywords: ['clinica', 'medico', 'saude', 'hospital'], score: 85 },
  { keywords: ['contabil', 'contador'], score: 75 },
  { keywords: ['imobiliar', 'corretor'], score: 80 },
  { keywords: ['restaurante', 'pizzaria', 'lanchonete', 'bar '], score: 55 },
  { keywords: ['salao', 'cabeleireiro', 'barbearia'], score: 65 },
];

const DIRECT_VARIANTS: MessageVariant[] = ['direct_google_focus', 'direct_lead_generation'];
const INDIRECT_VARIANTS: MessageVariant[] = ['indirect_value_focus', 'indirect_positioning'];
const AUTHORITY_VARIANTS: MessageVariant[] = ['authority_social_proof'];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getCityTier(cidade: string): CityTier {
  const city = normalizeText(cidade);
  if (TIER_1_CITIES.has(city)) return 'TIER_1';
  if (TIER_2_CITIES.has(city)) return 'TIER_2';
  return 'TIER_3';
}

export function getCityTierWeight(tier: CityTier): number {
  switch (tier) {
    case 'TIER_1': return 30;
    case 'TIER_2': return 15;
    default: return 0;
  }
}

export function getNicheIntentScore(categoria: string): number {
  const cat = normalizeText(categoria);
  for (const entry of NICHE_INTENT) {
    if (entry.keywords.some((kw) => cat.includes(kw))) {
      return entry.score;
    }
  }
  return 50;
}

export function getLeadStrategyType(leadScoreFinal: number): LeadStrategyType {
  if (leadScoreFinal >= 160) return 'DIRECT';
  if (leadScoreFinal >= 120) return 'INDIRECT';
  return 'AUTHORITY';
}

export function getPrioridadeFromFinalScore(leadScoreFinal: number): Prioridade {
  if (leadScoreFinal >= 160) return 'Muito Alta';
  if (leadScoreFinal >= 120) return 'Alta';
  if (leadScoreFinal >= 80) return 'Media';
  return 'Baixa';
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickMessageVariant(
  strategy: LeadStrategyType,
  seed: string
): MessageVariant {
  const pools: Record<LeadStrategyType, MessageVariant[]> = {
    DIRECT: DIRECT_VARIANTS,
    INDIRECT: INDIRECT_VARIANTS,
    AUTHORITY: AUTHORITY_VARIANTS,
  };
  const variants = pools[strategy];
  return variants[hashSeed(seed) % variants.length];
}

export function calculateSiteScoreFromLead(lead: Pick<Lead, 'website' | 'websiteAnalysis' | 'avaliacoes' | 'nota'>): number {
  const analysis = lead.websiteAnalysis;
  const siteStatus = resolveSiteStatusForScoring(
    lead.website,
    analysis?.siteStatus || (lead.website ? 'Online' : 'Sem Site')
  );
  return calculateScore({
    website: lead.website,
    siteStatus,
    hasWhatsapp: analysis?.hasWhatsapp ?? false,
    hasForm: analysis?.hasForm ?? false,
    isResponsive: analysis?.isResponsive ?? false,
    hasHttps: analysis?.hasHttps ?? false,
    avaliacoes: lead.avaliacoes,
    nota: lead.nota,
  });
}

export function buildStrategyProfile(input: {
  cidade: string;
  categoria: string;
  siteScore: number;
  seed?: string;
}): StrategyProfile {
  const cityTier = getCityTier(input.cidade);
  const cityTierWeight = getCityTierWeight(cityTier);
  const nicheIntentScore = getNicheIntentScore(input.categoria);
  const leadScoreFinal = input.siteScore + nicheIntentScore + cityTierWeight;
  const leadStrategyType = getLeadStrategyType(leadScoreFinal);
  const messageVariant = pickMessageVariant(leadStrategyType, input.seed || input.categoria);

  return {
    cityTier,
    nicheIntentScore,
    siteScore: input.siteScore,
    cityTierWeight,
    leadScoreFinal,
    leadStrategyType,
    messageVariant,
    prioridade: getPrioridadeFromFinalScore(leadScoreFinal),
  };
}

function getSiteIssues(lead: Lead): string[] {
  const issues: string[] = [];
  const hasPhone = !!lead.telefone?.trim();
  const presence = getDigitalPresence(lead);

  if (presence === 'none') {
    if (hasPhone) {
      issues.push('não possui site profissional — o contato parece ser apenas por telefone/WhatsApp');
    } else {
      issues.push('ainda não possui um site profissional nem canal digital claro de contato');
    }
  } else if (presence === 'instagram' || isInstagramOnlyLead(lead)) {
    issues.push('usa apenas o Instagram como presença online, sem um site profissional');
    if (!hasPhone) {
      issues.push('não há um canal direto de contato além das redes sociais');
    }
  } else if (presence === 'whatsapp') {
    issues.push('usa apenas link de WhatsApp no Google Meu Negócio, sem site profissional');
  } else if (presence === 'social') {
    issues.push('usa apenas rede social (Facebook, Linktree etc.), sem site profissional');
  } else if (
    lead.websiteAnalysis?.siteStatus === 'Offline' ||
    lead.websiteAnalysis?.siteStatus === 'Timeout'
  ) {
    issues.push('o site está fora do ar');
  } else {
    if (!lead.websiteAnalysis?.hasHttps) issues.push('o site não usa HTTPS');
    if (!lead.websiteAnalysis?.isResponsive) issues.push('o site não funciona bem no celular');
    if (!lead.websiteAnalysis?.hasWhatsapp && hasPhone) {
      issues.push('o site não integra WhatsApp para facilitar o contato');
    } else if (!lead.websiteAnalysis?.hasWhatsapp) {
      issues.push('não há WhatsApp no site para facilitar contato');
    }
    if (!lead.websiteAnalysis?.hasForm) issues.push('não há formulário de captura de leads');
  }
  return issues;
}

export function generateStrategyMessage(lead: Lead): string {
  const siteScore = lead.siteScore ?? lead.score ?? calculateSiteScoreFromLead(lead);
  const profile = buildStrategyProfile({
    cidade: lead.cidade,
    categoria: lead.categoria,
    siteScore,
    seed: lead.id || lead.empresa,
  });
  const messageVariant = lead.messageVariant ?? profile.messageVariant;
  const issues = getSiteIssues(lead);
  const issueText =
    issues.length > 0
      ? issues.slice(0, 2).join(' e ')
      : 'há espaço para melhorar a presença digital e atrair mais clientes';

  const empresa = lead.empresa;
  const categoria = lead.categoria;

  switch (messageVariant) {
    case 'direct_google_focus':
      return `Vi o perfil da ${empresa} e percebi que ${issueText}.

Isso acaba limitando a visibilidade no Google e a captação de novos pacientes/clientes.

Trabalho com sites e landing pages focados em aparecer nas buscas e gerar contatos. Posso te mostrar uma sugestão rápida, sem compromisso?`;

    case 'direct_lead_generation':
      return `Analisei a presença digital da ${empresa} e notei que ${issueText}.

Muitos negócios de ${categoria} perdem oportunidades por não ter um canal claro de captação online.

Desenvolvo sites e páginas pensadas para transformar visitas em contatos. Topa ver uma ideia aplicada ao seu caso?`;

    case 'indirect_value_focus':
      return `Acompanho o mercado de ${categoria} e o perfil da ${empresa} chamou minha atenção.

Percebi que ${issueText}, o que pode impactar como o público percebe o valor do serviço.

Ajudo empresas a transmitirem mais profissionalismo online. Se fizer sentido, posso compartilhar um insight específico para vocês.`;

    case 'indirect_positioning':
      return `Vi o trabalho da ${empresa} e achei interessante o posicionamento no segmento de ${categoria}.

Uma observação: ${issueText}. Pequenos ajustes digitais costumam mudar bastante a percepção de quem pesquisa antes de contratar.

Se quiser, posso te mandar uma sugestão leve de melhoria — sem compromisso.`;

    case 'authority_social_proof':
    default:
      return `Trabalho com presença digital para negócios de ${categoria} e observei o perfil da ${empresa}.

No mercado atual, empresas que investem em site profissional e Google Meu Negócio costumam se destacar na região.

Notei que ${issueText}. Se em algum momento quiser conversar sobre isso, fico à disposição.`;
  }
}

export function enrichLeadStrategy(lead: Lead): Lead {
  const siteScore = calculateSiteScoreFromLead(lead);
  const profile = buildStrategyProfile({
    cidade: lead.cidade,
    categoria: lead.categoria,
    siteScore,
    seed: lead.id || lead.empresa,
  });

  const enriched: Lead = {
    ...lead,
    score: siteScore,
    siteScore: profile.siteScore,
    cityTier: profile.cityTier,
    nicheIntentScore: profile.nicheIntentScore,
    leadScoreFinal: profile.leadScoreFinal,
    leadStrategyType: profile.leadStrategyType,
    messageVariant: profile.messageVariant,
    prioridade: profile.prioridade,
  };

  if (!enriched.mensagemProspeccao?.trim()) {
    enriched.mensagemProspeccao = generateStrategyMessage(enriched);
  }

  return enriched;
}

export function getLeadSortScore(lead: Lead): number {
  return lead.leadScoreFinal ?? lead.score ?? 0;
}

export function applyStrategyToNewLead(
  lead: Omit<Lead, 'cityTier' | 'nicheIntentScore' | 'siteScore' | 'leadScoreFinal' | 'leadStrategyType' | 'messageVariant' | 'prioridade' | 'mensagemProspeccao'> & {
    score: number;
  }
): Lead {
  const profile = buildStrategyProfile({
    cidade: lead.cidade,
    categoria: lead.categoria,
    siteScore: lead.score,
    seed: lead.id,
  });

  const fullLead: Lead = {
    ...lead,
    siteScore: profile.siteScore,
    cityTier: profile.cityTier,
    nicheIntentScore: profile.nicheIntentScore,
    leadScoreFinal: profile.leadScoreFinal,
    leadStrategyType: profile.leadStrategyType,
    messageVariant: profile.messageVariant,
    prioridade: profile.prioridade,
    score: profile.siteScore,
  };

  return {
    ...fullLead,
    mensagemProspeccao: generateStrategyMessage(fullLead),
  };
}

export function getStrategyPriorityLabel(leadScoreFinal: number): 'quente' | 'morno' | 'frio' {
  if (leadScoreFinal >= 160) return 'quente';
  if (leadScoreFinal >= 120) return 'morno';
  return 'frio';
}
