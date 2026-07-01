import { Phone } from 'lucide-react';
import { formatPhone, cn } from '@/lib/utils';

interface ContactPhoneProps {
  phone: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function ContactPhone({ phone, size = 'sm', showIcon = true }: ContactPhoneProps) {
  if (!phone) {
    return <span className="text-muted-foreground">-</span>;
  }

  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
      {showIcon && <Phone className={isSmall ? 'h-3 w-3 shrink-0' : 'h-4 w-4 shrink-0'} />}
      <span className={cn(isSmall ? 'text-xs' : 'text-sm', 'truncate')}>{formatPhone(phone)}</span>
    </div>
  );
}
