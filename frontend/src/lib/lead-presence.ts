import { Lead } from '@/types';

export type DigitalPresence = 'none' | 'instagram' | 'whatsapp' | 'social' | 'professional';

function parseUrl(url: string): URL | null {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return null;
  }
}

export function isInstagramUrl(url: string): boolean {
  if (!url?.trim()) return false;
  const parsed = parseUrl(url);
  if (parsed) {
    const host = parsed.hostname.toLowerCase();
    return host === 'instagram.com' || host.endsWith('.instagram.com');
  }
  return /instagram\.com/i.test(url);
}

export function isWhatsAppUrl(url: string): boolean {
  if (!url?.trim()) return false;
  const lower = url.toLowerCase();
  if (/wa\.me|api\.whatsapp|whatsapp\.com|whatsapp:/i.test(lower)) return true;
  const parsed = parseUrl(url);
  if (!parsed) return false;
  const host = parsed.hostname.toLowerCase();
  return host === 'wa.me' || host.endsWith('.wa.me') || host.includes('whatsapp');
}

const SOCIAL_HOSTS = [
  'facebook.com', 'fb.com', 'fb.me', 'linktr.ee', 'linkedin.com', 'tiktok.com',
  'twitter.com', 'x.com', 'youtube.com', 'youtu.be', 'bio.link', 'beacons.ai',
];

export function isSocialOnlyUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (isInstagramUrl(url) || isWhatsAppUrl(url)) return false;
  const parsed = parseUrl(url);
  if (!parsed) return false;
  const host = parsed.hostname.toLowerCase();
  return SOCIAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

export function classifyWebsiteUrl(url: string): DigitalPresence {
  if (!url?.trim()) return 'none';
  if (isInstagramUrl(url)) return 'instagram';
  if (isWhatsAppUrl(url)) return 'whatsapp';
  if (isSocialOnlyUrl(url)) return 'social';
  return 'professional';
}

export function resolveSiteStatusForScoring(website: string, analysisStatus?: string): string {
  const urlType = classifyWebsiteUrl(website);
  if (urlType === 'instagram') return 'Instagram';
  if (urlType === 'whatsapp') return 'WhatsApp';
  if (urlType === 'social') return 'Social';
  if (urlType === 'none') return 'Sem Site';
  if (analysisStatus === 'Offline' || analysisStatus === 'Timeout') return analysisStatus;
  return analysisStatus || 'Online';
}

export function normalizeInstagramUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return `https://${trimmed}`;
}

export function getInstagramUrl(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): string | null {
  if (lead.websiteAnalysis?.hasInstagram && lead.website) return lead.website;
  if (isInstagramUrl(lead.website)) return lead.website;
  return null;
}

export function getDigitalPresence(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): DigitalPresence {
  const urlType = classifyWebsiteUrl(lead.website);
  if (urlType !== 'professional') return urlType;
  const status = resolveSiteStatusForScoring(lead.website, lead.websiteAnalysis?.siteStatus);
  if (status === 'Instagram') return 'instagram';
  if (status === 'WhatsApp') return 'whatsapp';
  if (status === 'Social') return 'social';
  if (status === 'Sem Site') return 'none';
  return 'professional';
}

export function hasProfessionalWebsite(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): boolean {
  if (!lead.website?.trim()) return false;
  if (getDigitalPresence(lead) !== 'professional') return false;
  const status = resolveSiteStatusForScoring(lead.website, lead.websiteAnalysis?.siteStatus);
  return status === 'Online';
}

export function getPresenceLabel(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): string {
  const presence = getDigitalPresence(lead);
  if (presence === 'none') return 'Sem site';
  if (presence === 'instagram') return 'Instagram';
  if (presence === 'whatsapp') return 'WhatsApp';
  if (presence === 'social') return 'Rede social';
  const status = resolveSiteStatusForScoring(lead.website, lead.websiteAnalysis?.siteStatus);
  if (status === 'Offline') return 'Site offline';
  if (status === 'Timeout') return 'Site inacessível';
  return 'Site online';
}
