import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  ArrowUpRight,
  ChevronDown,
  Clock,
  Hand,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getWhatsAppLink } from '@/lib/utils';
import {
  WHATSAPP_MESSAGE_OPTIONS,
  buildWhatsAppMessage,
  type WhatsAppMessageType,
} from '@/lib/whatsapp-messages';
import { api } from '@/services/api';
import { Lead, LeadStatus } from '@/types';

interface WhatsAppMenuProps {
  phone: string;
  lead?: Lead;
  pitchMessage?: string;
  size?: 'sm' | 'md';
  onMessageSent?: () => void;
}

const MESSAGE_META: Record<
  WhatsAppMessageType,
  { icon: LucideIcon; accent: string; step: string }
> = {
  saudacao: {
    icon: Hand,
    accent: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/25',
    step: '1',
  },
  pitch: {
    icon: Megaphone,
    accent: 'bg-green-500/15 text-green-400 ring-green-500/25',
    step: '2',
  },
  followup: {
    icon: Clock,
    accent: 'bg-cyan-500/15 text-cyan-400 ring-cyan-500/25',
    step: '3',
  },
};

const ADVANCED_STATUSES: LeadStatus[] = [
  'Interessado',
  'Proposta Enviada',
  'Fechado',
  'Perdido',
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function truncatePreview(text: string, max = 80): string {
  const single = text.replace(/\s+/g, ' ').trim();
  return single.length > max ? `${single.slice(0, max)}…` : single;
}

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function WhatsAppMenu({
  phone,
  lead,
  pitchMessage,
  size = 'sm',
  onMessageSent,
}: WhatsAppMenuProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState<WhatsAppMessageType | null>(null);

  if (!phone) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isSmall = size === 'sm';

  function getLink(type: WhatsAppMessageType): string | null {
    const message = buildWhatsAppMessage(type, { lead, pitchOverride: pitchMessage });
    return getWhatsAppLink(phone, message);
  }

  async function handleSend(type: WhatsAppMessageType) {
    const link = getLink(type);
    if (!link) return;

    setSending(type);
    window.open(link, '_blank', 'noopener,noreferrer');
    setOpen(false);

    if (lead?.id) {
      const today = todayIsoDate();
      const shouldSetStatus =
        !lead.status || !ADVANCED_STATUSES.includes(lead.status);

      try {
        await api.updateLead(lead.id, {
          ...(shouldSetStatus ? { status: 'Mensagem Enviada' as const } : {}),
          ultimoContato: today,
        });
        onMessageSent?.();
      } catch {
        // abre o WhatsApp mesmo se o CRM falhar
      }
    }

    setSending(null);
  }

  return (
    <div className="relative inline-flex shrink-0" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'gap-1 border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300',
              isSmall ? 'h-7 px-2 text-xs' : ''
            )}
          >
            <WhatsAppIcon className="h-3.5 w-3.5 shrink-0" />
            WhatsApp
            <ChevronDown
              className={cn('h-3 w-3 shrink-0 opacity-70 transition-transform', open && 'rotate-180')}
            />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-[200] w-[min(320px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-popover p-0 shadow-xl animate-in fade-in-0 zoom-in-95"
            sideOffset={8}
            align="end"
            collisionPadding={16}
            avoidCollisions
          >
            <div className="border-b border-white/[0.06] bg-green-500/[0.06] px-3.5 py-3">
              <p className="text-sm font-semibold text-foreground">Enviar mensagem</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Abre o WhatsApp e marca o lead como{' '}
                <span className="text-cyan-400/90">Mensagem Enviada</span>
              </p>
            </div>

            <div className="p-1.5">
              {WHATSAPP_MESSAGE_OPTIONS.map((option) => {
                const link = getLink(option.id);
                if (!link) return null;

                const meta = MESSAGE_META[option.id];
                const Icon = meta.icon;
                const preview = truncatePreview(
                  buildWhatsAppMessage(option.id, { lead, pitchOverride: pitchMessage })
                );
                const isSending = sending === option.id;

                return (
                  <DropdownMenu.Item
                    key={option.id}
                    className={cn(
                      'group flex cursor-pointer items-start gap-3 rounded-lg px-2.5 py-2.5 outline-none',
                      'hover:bg-accent focus:bg-accent data-[highlighted]:bg-accent'
                    )}
                    disabled={isSending}
                    onSelect={(e) => {
                      e.preventDefault();
                      void handleSend(option.id);
                    }}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
                        meta.accent
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Passo {meta.step}
                        </span>
                        <span className="text-sm font-medium text-foreground">{option.label}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
                      <p className="mt-1.5 rounded-md bg-secondary/60 px-2 py-1 text-[11px] leading-relaxed text-foreground/70 line-clamp-2">
                        {preview}
                      </p>
                    </div>

                    <ArrowUpRight
                      className={cn(
                        'mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity',
                        'group-hover:opacity-100 group-focus:opacity-100 group-data-[highlighted]:opacity-100'
                      )}
                    />
                  </DropdownMenu.Item>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] px-3.5 py-2 text-[11px] text-muted-foreground">
              Fluxo sugerido: saudação → aguarde resposta → pitch → follow-up
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
