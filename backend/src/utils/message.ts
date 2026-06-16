import { Lead, LeadStatus } from '../types/index.js';

const CONTACTED_STATUSES: LeadStatus[] = [
  'Mensagem Enviada',
  'Interessado',
  'Proposta Enviada',
  'Fechado',
  'Perdido',
];

export function generateProspectionMessage(lead: Lead): string {
  const issues: string[] = [];

  if (!lead.website) {
    issues.push('sua empresa ainda não possui um site profissional');
  } else if (lead.websiteAnalysis?.siteStatus === 'Offline' || lead.websiteAnalysis?.siteStatus === 'Timeout') {
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

  return `Olá, tudo bem?

${issueText}

Trabalho com desenvolvimento de landing pages profissionais, sites institucionais e otimização do Google Meu Negócio.

Posso lhe mostrar algumas sugestões sem compromisso?`;
}

export function isLeadContacted(lead: Lead): boolean {
  return CONTACTED_STATUSES.includes(lead.status);
}
