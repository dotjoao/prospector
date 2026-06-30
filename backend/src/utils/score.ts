import { Prioridade } from '../types/index.js';

export function calculateScore(params: {
  website: string;
  siteStatus: string;
  hasWhatsapp: boolean;
  hasForm: boolean;
  isResponsive: boolean;
  avaliacoes: number;
  nota: number;
}): number {
  let score = 0;

  if (!params.website || params.website.trim() === '' || params.siteStatus === 'Instagram') {
    score += 40;
  }

  if (params.siteStatus === 'Instagram') {
    // Instagram não substitui site profissional — pontua como oportunidade
  } else if (params.siteStatus === 'Offline' || params.siteStatus === 'Timeout') {
    score += 30;
  }

  if (!params.hasWhatsapp) {
    score += 20;
  }

  if (!params.hasForm) {
    score += 10;
  }

  if (!params.isResponsive) {
    score += 15;
  }

  if (params.avaliacoes > 100) {
    score += 30;
  } else if (params.avaliacoes > 50) {
    score += 20;
  }

  if (params.nota > 4.5) {
    score += 10;
  }

  return score;
}

export function getPrioridade(score: number): Prioridade {
  if (score <= 30) return 'Baixa';
  if (score <= 60) return 'Media';
  if (score <= 100) return 'Alta';
  return 'Muito Alta';
}

export function extractCityFromAddress(address: string): string {
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 3]?.trim() || parts[parts.length - 2]?.trim() || '';
  }
  return '';
}

export function extractStateFromAddress(address: string): string {
  const match = address.match(/\b([A-Z]{2})\b/);
  return match ? match[1] : '';
}
