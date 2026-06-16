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
  return phone;
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
