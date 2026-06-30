import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPhone, getWhatsAppLink } from '@/lib/utils';
import {
  WHATSAPP_MESSAGE_OPTIONS,
  buildWhatsAppMessage,
  type WhatsAppMessageType,
} from '@/lib/whatsapp-messages';
import { Lead } from '@/types';

interface WhatsAppMenuProps {
  phone: string;
  lead?: Lead;
  pitchMessage?: string;
  size?: 'sm' | 'md';
  showPhone?: boolean;
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function WhatsAppMenu({
  phone,
  lead,
  pitchMessage,
  size = 'sm',
  showPhone = true,
}: WhatsAppMenuProps) {
  if (!phone) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isSmall = size === 'sm';

  function getLink(type: WhatsAppMessageType): string | null {
    const message = buildWhatsAppMessage(type, { lead, pitchOverride: pitchMessage });
    return getWhatsAppLink(phone, message);
  }

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {showPhone && (
        <span className={isSmall ? 'text-xs' : 'text-sm'}>{formatPhone(phone)}</span>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-7 gap-1 border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:text-green-300 ${isSmall ? 'px-2 text-xs' : ''}`}
          >
            <WhatsAppIcon className="h-3.5 w-3.5" />
            WhatsApp
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="z-50 min-w-[240px] rounded-lg border border-border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
            sideOffset={6}
            align="end"
          >
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Escolha a mensagem
            </div>
            {WHATSAPP_MESSAGE_OPTIONS.map((option, index) => {
              const link = getLink(option.id);
              if (!link) return null;

              return (
                <DropdownMenu.Item key={option.id} asChild>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex cursor-pointer flex-col gap-0.5 rounded-md px-2 py-2 text-sm outline-none hover:bg-accent focus:bg-accent"
                  >
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <MessageCircle className="h-3.5 w-3.5 text-green-400" />
                      {index + 1}. {option.label}
                    </span>
                    <span className="pl-5 text-xs text-muted-foreground line-clamp-2">
                      {option.description}
                    </span>
                  </a>
                </DropdownMenu.Item>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
