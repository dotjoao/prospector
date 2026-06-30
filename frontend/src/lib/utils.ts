import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: string): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

export function formatPhone(phone: string): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function getTimeGreeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function getDefaultWhatsAppMessage(date: Date = new Date()): string {
  return `${getTimeGreeting(date)}, tudo bem?`;
}

export function getWhatsAppLink(phone: string, message?: string): string | null {
  let digits = getPhoneDigits(phone);
  if (!digits) return null;

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  let baseUrl: string;
  if (digits.startsWith('55') && digits.length >= 12) {
    baseUrl = `https://wa.me/${digits}`;
  } else if (digits.length === 10 || digits.length === 11) {
    baseUrl = `https://wa.me/55${digits}`;
  } else {
    baseUrl = `https://wa.me/${digits}`;
  }

  const text = message?.trim();
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }

  return baseUrl;
}

export function getPrioridadeColor(prioridade: string): string {
  switch (prioridade) {
    case 'Muito Alta':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Alta':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'Media':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    default:
      return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Fechado':
      return 'bg-emerald-500/20 text-emerald-400';
    case 'Interessado':
      return 'bg-blue-500/20 text-blue-400';
    case 'Proposta Enviada':
      return 'bg-purple-500/20 text-purple-400';
    case 'Mensagem Enviada':
      return 'bg-cyan-500/20 text-cyan-400';
    case 'Perdido':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export function getLeadPriorityScore(lead: { leadScoreFinal?: number; score: number }): number {
  return lead.leadScoreFinal ?? lead.score;
}

export function getStrategyPriorityStrip(score: number): string {
  switch (getStrategyPriorityLabel(score)) {
    case 'quente':
      return 'priority-strip-hot';
    case 'morno':
      return 'priority-strip-warm';
    default:
      return 'priority-strip-cold';
  }
}

export function getStrategyPriorityLabel(score: number): 'quente' | 'morno' | 'frio' {
  if (score >= 160) return 'quente';
  if (score >= 120) return 'morno';
  return 'frio';
}

export function getStrategyPriorityColor(score: number): string {
  switch (getStrategyPriorityLabel(score)) {
    case 'quente':
      return 'border-red-500/40 bg-red-500/10';
    case 'morno':
      return 'border-yellow-500/40 bg-yellow-500/10';
    default:
      return 'border-green-500/40 bg-green-500/10';
  }
}

export function getStrategyTypeLabel(type?: string): string {
  switch (type) {
    case 'DIRECT':
      return 'Direta';
    case 'INDIRECT':
      return 'Indireta';
    case 'AUTHORITY':
      return 'Autoridade';
    default:
      return '—';
  }
}

export function getStrategyTypeBadgeColor(type?: string): string {
  switch (type) {
    case 'DIRECT':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'INDIRECT':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'AUTHORITY':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}
