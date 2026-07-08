import { useState } from 'react';
import { Check, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInstagramUrl, normalizeInstagramUrl } from '@/lib/lead-presence';
import { buildPitchMessage } from '@/lib/pitch-message';
import { api } from '@/services/api';
import { Lead, LeadStatus } from '@/types';
import { cn } from '@/lib/utils';

interface InstagramButtonProps {
  lead: Pick<Lead, 'website' | 'websiteAnalysis' | 'categoria' | 'cidade' | 'id' | 'status' | 'mensagemProspeccao'>;
  pitchMessage?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  onMessageSent?: () => void;
}

const ADVANCED_STATUSES: LeadStatus[] = [
  'Interessado',
  'Proposta Enviada',
  'Fechado',
  'Perdido',
];

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function InstagramButton({
  lead,
  pitchMessage,
  size = 'sm',
  showLabel = true,
  onMessageSent,
}: InstagramButtonProps) {
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const url = getInstagramUrl(lead);
  if (!url) return null;

  const isSmall = size === 'sm';

  async function handleOpen() {
    const message =
      pitchMessage?.trim() ||
      lead.mensagemProspeccao?.trim() ||
      buildPitchMessage({ categoria: lead.categoria, cidade: lead.cidade });

    setSending(true);
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.open(normalizeInstagramUrl(url!), '_blank', 'noopener,noreferrer');
      setTimeout(() => setCopied(false), 2500);

      if (lead.id) {
        const today = todayIsoDate();
        const shouldSetStatus = !lead.status || !ADVANCED_STATUSES.includes(lead.status);

        try {
          await api.updateLead(lead.id, {
            ...(shouldSetStatus ? { status: 'Mensagem Enviada' as const } : {}),
            ultimoContato: today,
          });
          onMessageSent?.();
        } catch {
          // abre o Instagram mesmo se o CRM falhar
        }
      }
    } catch {
      window.open(normalizeInstagramUrl(url!), '_blank', 'noopener,noreferrer');
    } finally {
      setSending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      title="Copia a mensagem de pitch e abre o Instagram"
      className={cn(
        'gap-1 border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300',
        isSmall ? 'h-7 px-2 text-xs' : ''
      )}
      disabled={sending}
      onClick={(e) => {
        e.stopPropagation();
        void handleOpen();
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Instagram className="h-3.5 w-3.5" />}
      {showLabel && (copied ? 'Copiado!' : 'Instagram')}
    </Button>
  );
}
