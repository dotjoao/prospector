import { Phone } from 'lucide-react';
import { WhatsAppMenu } from '@/components/WhatsAppMenu';
import { Lead } from '@/types';

interface ContactPhoneProps {
  phone: string;
  lead?: Lead;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  message?: string;
}

export function ContactPhone({ phone, lead, size = 'sm', showIcon = true, message }: ContactPhoneProps) {
  if (!phone) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {showIcon && <Phone className={isSmall ? 'h-3 w-3' : 'h-4 w-4'} />}
      <WhatsAppMenu
        phone={phone}
        lead={lead}
        pitchMessage={message}
        size={size}
        showPhone={showIcon}
      />
    </div>
  );
}
