import { Lead, LeadStatus } from '../types/index.js';
import { generateStrategyMessage } from '../lib/strategy-engine.js';

const CONTACTED_STATUSES: LeadStatus[] = [
  'Mensagem Enviada',
  'Interessado',
  'Proposta Enviada',
  'Fechado',
  'Perdido',
];

export function getTimeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getDefaultWhatsAppMessage(date: Date = new Date()): string {
  return `${getTimeGreeting(date)}, tudo bem?`;
}

export function generateProspectionMessage(lead: Lead): string {
  return generateStrategyMessage(lead);
}

export function isLeadContacted(lead: Lead): boolean {
  return CONTACTED_STATUSES.includes(lead.status);
}
