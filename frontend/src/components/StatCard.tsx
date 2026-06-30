import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  iconClassName?: string;
  accent?: 'default' | 'hot' | 'warm' | 'cold' | 'blue' | 'cyan' | 'emerald';
  compact?: boolean;
}

const accentStyles = {
  default: 'from-primary/20 to-transparent border-white/[0.06]',
  hot: 'from-red-500/15 to-transparent border-red-500/20',
  warm: 'from-amber-500/15 to-transparent border-amber-500/20',
  cold: 'from-emerald-500/15 to-transparent border-emerald-500/20',
  blue: 'from-blue-500/15 to-transparent border-blue-500/20',
  cyan: 'from-cyan-500/15 to-transparent border-cyan-500/20',
  emerald: 'from-emerald-500/15 to-transparent border-emerald-500/20',
};

const iconStyles = {
  default: 'bg-primary/15 text-primary',
  hot: 'bg-red-500/15 text-red-400',
  warm: 'bg-amber-500/15 text-amber-400',
  cold: 'bg-emerald-500/15 text-emerald-400',
  blue: 'bg-blue-500/15 text-blue-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  iconClassName,
  accent = 'default',
  compact = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'glass-card relative overflow-hidden bg-gradient-to-br transition-all hover:border-white/10',
        accentStyles[accent],
        compact ? 'p-4' : 'p-5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn('font-bold tracking-tight', compact ? 'text-2xl' : 'text-3xl')}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
        <div className={cn('rounded-xl p-2.5 shrink-0', iconStyles[accent], iconClassName)}>
          <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
        </div>
      </div>
    </div>
  );
}
