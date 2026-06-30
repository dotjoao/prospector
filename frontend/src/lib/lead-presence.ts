import { Lead } from '@/types';

export function isInstagramUrl(url: string): boolean {
  if (!url?.trim()) return false;
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase();
    return host === 'instagram.com' || host === 'www.instagram.com';
  } catch {
    return /instagram\.com/i.test(url);
  }
}

export function normalizeInstagramUrl(url: string): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('http')) return trimmed;
  return `https://${trimmed}`;
}

export function getInstagramUrl(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): string | null {
  if (lead.website?.trim() && isInstagramUrl(lead.website)) {
    return normalizeInstagramUrl(lead.website);
  }
  return null;
}

export function hasProfessionalWebsite(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): boolean {
  if (!lead.website?.trim()) return false;
  if (isInstagramUrl(lead.website)) return false;
  if (lead.websiteAnalysis?.siteStatus === 'Instagram') return false;
  return true;
}

export function isInstagramOnlyLead(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): boolean {
  return !!getInstagramUrl(lead) || lead.websiteAnalysis?.siteStatus === 'Instagram';
}

export type DigitalPresence = 'site' | 'instagram' | 'none';

export function getDigitalPresence(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): DigitalPresence {
  if (hasProfessionalWebsite(lead)) return 'site';
  if (isInstagramOnlyLead(lead)) return 'instagram';
  return 'none';
}

export function getPresenceLabel(lead: Pick<Lead, 'website' | 'websiteAnalysis'>): string {
  switch (getDigitalPresence(lead)) {
    case 'site':
      return 'Com site';
    case 'instagram':
      return 'Só Instagram';
    default:
      return 'Sem site';
  }
}
