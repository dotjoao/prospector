import {
  classifyWebsiteUrl,
  resolveSiteStatusForScoring,
} from '../lib/lead-presence.js';

export interface ScoreInput {
  website: string;
  siteStatus: string;
  hasWhatsapp: boolean;
  hasForm: boolean;
  isResponsive: boolean;
  hasHttps?: boolean;
  avaliacoes: number;
  nota: number;
}

export function calculateScore(input: ScoreInput): number {
  const urlType = classifyWebsiteUrl(input.website);
  const status = resolveSiteStatusForScoring(input.website, input.siteStatus);
  let score = 0;

  if (urlType === 'none' || status === 'Sem Site') {
    score += 52;
  } else if (urlType === 'instagram' || status === 'Instagram') {
    score += 50;
  } else if (urlType === 'whatsapp' || status === 'WhatsApp') {
    score += 50;
  } else if (urlType === 'social' || status === 'Social') {
    score += 44;
  } else if (status === 'Offline' || status === 'Timeout') {
    score += 40;
  } else {
    score += 6;
    if (!input.hasHttps) score += 10;
    if (!input.isResponsive) score += 12;
    if (!input.hasWhatsapp) score += 8;
    if (!input.hasForm) score += 6;
    score = Math.min(score, 32);
  }

  const weakDigitalPresence = score >= 32;

  if (weakDigitalPresence) {
    if (input.avaliacoes >= 50) score += 14;
    else if (input.avaliacoes >= 20) score += 10;
    else if (input.avaliacoes >= 5) score += 5;

    if (input.nota >= 4.5) score += 10;
    else if (input.nota >= 4.0) score += 5;
  } else if (input.avaliacoes >= 100 && input.nota >= 4.8) {
    score += 2;
  }

  return Math.round(Math.min(score, 100));
}

export function extractStateFromAddress(address: string): string | null {
  if (!address) return null;
  const match = address.match(/\b([A-Z]{2})\b/);
  return match ? match[1] : null;
}

export function extractCityFromAddress(address: string): string | null {
  if (!address) return null;
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 2].replace(/\d{5}-?\d{3}/, '').trim();
  }
  return null;
}
