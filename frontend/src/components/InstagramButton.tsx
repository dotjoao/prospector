import { Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getInstagramUrl, normalizeInstagramUrl } from '@/lib/lead-presence';
import { Lead } from '@/types';

interface InstagramButtonProps {
  lead: Pick<Lead, 'website' | 'websiteAnalysis'>;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function InstagramButton({ lead, size = 'sm', showLabel = true }: InstagramButtonProps) {
  const url = getInstagramUrl(lead);
  if (!url) return null;

  const isSmall = size === 'sm';

  return (
    <Button
      variant="outline"
      size="sm"
      className={`gap-1 border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:text-pink-300 ${isSmall ? 'h-7 px-2 text-xs' : ''}`}
      asChild
      onClick={(e) => e.stopPropagation()}
    >
      <a href={normalizeInstagramUrl(url)} target="_blank" rel="noopener noreferrer">
        <Instagram className="h-3.5 w-3.5" />
        {showLabel && 'Instagram'}
      </a>
    </Button>
  );
}
