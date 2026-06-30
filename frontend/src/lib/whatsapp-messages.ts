import { Lead } from '@/types';
import { getDefaultWhatsAppMessage, getTimeGreeting } from '@/lib/utils';

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
    description: 'Oi, tudo bem?',
  },
  {
    id: 'pitch',
    label: 'Pitch',
    description: 'Elogio + oferta de serviço',
  },
  {
    id: 'followup',
    label: 'Follow-up',
    description: 'Retomar contato',
  },
];

function buildPitchFromLead(lead: Lead): string {
  const issues: string[] = [];

  if (!lead.website) {
    issues.push('sua empresa ainda não possui um site profissional');
  } else if (
    lead.websiteAnalysis?.siteStatus === 'Offline' ||
    lead.websiteAnalysis?.siteStatus === 'Timeout'
  ) {
    issues.push('o site da sua empresa está fora do ar');
  } else {
    if (!lead.websiteAnalysis?.hasHttps) {
      issues.push('o site não utiliza conexão segura (HTTPS)');
    }
    if (!lead.websiteAnalysis?.isResponsive) {
      issues.push('o site não está otimizado para celular');
    }
    if (!lead.websiteAnalysis?.hasWhatsapp) {
      issues.push('não há integração com WhatsApp para facilitar o contato');
    }
    if (!lead.websiteAnalysis?.hasForm) {
      issues.push('não há formulário de contato no site');
    }
  }

  const issueText =
    issues.length > 0
      ? `Analisei a presença digital da ${lead.empresa} e percebi que ${issues.slice(0, 2).join(' e ')}.`
      : `Analisei a presença digital da ${lead.empresa} e percebi que existem algumas oportunidades para aumentar a visibilidade online e facilitar o contato com novos clientes.`;

  return `${issueText}

Trabalho com desenvolvimento de landing pages profissionais, sites institucionais e otimização do Google Meu Negócio.

Posso lhe mostrar algumas sugestões sem compromisso?`;
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
      return getDefaultWhatsAppMessage();
    case 'pitch':
      if (options?.pitchOverride?.trim()) return options.pitchOverride.trim();
      if (options?.lead) return buildPitchFromLead(options.lead);
      return 'Gostaria de conversar sobre como melhorar a presença digital da sua empresa. Posso lhe mostrar algumas sugestões sem compromisso?';
    case 'followup':
      return buildFollowUpMessage();
  }
}

export function getWhatsAppMessagePreview(type: WhatsAppMessageType): string {
  return buildWhatsAppMessage(type, {
    lead: {
      id: '',
      empresa: 'sua empresa',
      categoria: '',
      endereco: '',
      cidade: '',
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
