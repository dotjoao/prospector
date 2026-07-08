import { Lead } from '@/types';
import { getTimeGreeting } from '@/lib/utils';
import { buildPitchMessage } from '@/lib/pitch-message';

export type WhatsAppMessageType = 'saudacao' | 'pitch' | 'followup';

export interface WhatsAppMessageOption {
  id: WhatsAppMessageType;
  label: string;
  description: string;
}

export const WHATSAPP_MESSAGE_OPTIONS: WhatsAppMessageOption[] = [
  {
    id: 'saudacao',
    label: 'Saudação',
    description: 'Olá! Tudo bem?',
  },
  {
    id: 'pitch',
    label: 'Pitch',
    description: 'Apresentação completa com proposta de site',
  },
  {
    id: 'followup',
    label: 'Follow-up',
    description: 'Retomar contato',
  },
];

function buildPitchFromLead(lead: Lead): string {
  if (lead.mensagemProspeccao?.trim()) {
    return lead.mensagemProspeccao.trim();
  }

  return buildPitchMessage({ categoria: lead.categoria, cidade: lead.cidade });
}

function buildFollowUpMessage(): string {
  return `${getTimeGreeting()}, tudo bem? Passando para saber se conseguiu ver minha mensagem anterior. Fico à disposição para conversarmos!`;
}

export function buildWhatsAppMessage(
  type: WhatsAppMessageType,
  options?: { lead?: Lead; pitchOverride?: string }
): string {
  switch (type) {
    case 'saudacao':
      return 'Olá! Tudo bem?';
    case 'pitch':
      if (options?.pitchOverride?.trim()) return options.pitchOverride.trim();
      if (options?.lead) return buildPitchFromLead(options.lead);
      return buildPitchMessage({ categoria: '', cidade: '' });
    case 'followup':
      return buildFollowUpMessage();
  }
}

export function getWhatsAppMessagePreview(type: WhatsAppMessageType): string {
  return buildWhatsAppMessage(type, {
    lead: {
      id: '',
      empresa: 'sua empresa',
      categoria: 'Nutricionista',
      endereco: '',
      cidade: 'Joinville',
      estado: '',
      telefone: '',
      website: '',
      nota: 0,
      avaliacoes: 0,
      googleMapsUrl: '',
      dataColeta: '',
      score: 0,
      prioridade: 'Media',
      status: 'Nao Contatado',
    },
  });
}
