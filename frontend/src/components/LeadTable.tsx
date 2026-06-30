import { useState } from 'react';
import { Eye, Star, Globe, ChevronLeft, ChevronRight, MapPin, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LeadDetailDialog } from '@/components/LeadDetailDialog';
import { ContactPhone } from '@/components/ContactPhone';
import { InstagramButton } from '@/components/InstagramButton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Lead } from '@/types';
import {
  cn,
  getStatusColor,
  getLeadPriorityScore,
  getStrategyPriorityStrip,
  getStrategyTypeBadgeColor,
  getStrategyTypeLabel,
  getStrategyPriorityLabel,
} from '@/lib/utils';
import { getPresenceLabel, getInstagramUrl } from '@/lib/lead-presence';

interface LeadTableProps {
  leads: Lead[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  title?: string;
  highlightTop?: number;
  onRefresh: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const tier = getStrategyPriorityLabel(score);
  const colors = {
    quente: 'bg-red-500/15 text-red-400 ring-red-500/30',
    morno: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
    frio: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl px-3 py-2 min-w-[4rem] ring-1',
        colors[tier]
      )}
    >
      <span className="text-xl font-bold leading-none">{score}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-80 mt-0.5">score</span>
    </div>
  );
}

export function LeadTable({
  leads,
  total,
  page = 1,
  pageSize = 50,
  onPageChange,
  loading,
  title = 'Leads',
  highlightTop,
  onRefresh,
}: LeadTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const displayTotal = total ?? leads.length;
  const totalPages = onPageChange ? Math.max(1, Math.ceil(displayTotal / pageSize)) : 1;

  function openLead(lead: Lead) {
    setSelectedLead(lead);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="glass-card py-16">
        <LoadingSpinner text="Carregando leads..." />
      </div>
    );
  }

  return (
    <>
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {displayTotal} lead{displayTotal !== 1 ? 's' : ''} · ordenados por score final
            </p>
          </div>
          {onPageChange && displayTotal > pageSize && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2 tabular-nums">
                {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-16 px-6">
            <p className="text-muted-foreground">Nenhum lead encontrado.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use a aba Prospectar para buscar oportunidades.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {leads.map((lead, index) => {
              const priorityScore = getLeadPriorityScore(lead);
              const isTop = highlightTop !== undefined && index < highlightTop;

              return (
                <div
                  key={lead.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] cursor-pointer group',
                    getStrategyPriorityStrip(priorityScore),
                    isTop && 'bg-primary/[0.03]'
                  )}
                  onClick={() => openLead(lead)}
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate group-hover:text-primary transition-colors">
                        {lead.empresa}
                      </span>
                      {isTop && (
                        <Badge variant="outline" className="text-[10px] border-primary/40 text-primary px-1.5">
                          #{index + 1}
                        </Badge>
                      )}
                      {lead.leadStrategyType && (
                        <Badge
                          className={cn(
                            'border text-[10px] px-1.5',
                            getStrategyTypeBadgeColor(lead.leadStrategyType)
                          )}
                        >
                          {getStrategyTypeLabel(lead.leadStrategyType)}
                        </Badge>
                      )}
                      <Badge className={cn('text-[10px] px-1.5', getStatusColor(lead.status))}>
                        {lead.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="font-medium text-foreground/70">{lead.categoria}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lead.cidade}
                      </span>
                      <span className="flex items-center gap-1">
                        {getInstagramUrl(lead) ? (
                          <Instagram className="h-3 w-3 text-pink-400" />
                        ) : (
                          <Globe className="h-3 w-3" />
                        )}
                        {getPresenceLabel(lead)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-400" />
                        {lead.nota} · {lead.avaliacoes} aval.
                      </span>
                      {lead.telefone ? (
                        <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                          <ContactPhone phone={lead.telefone} lead={lead} />
                          <InstagramButton lead={lead} />
                        </span>
                      ) : (
                        <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                          <span>Sem telefone</span>
                          <InstagramButton lead={lead} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ScoreBadge score={priorityScore} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-primary"
                      title="Ver detalhes"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLead(lead);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <LeadDetailDialog
        lead={selectedLead}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={onRefresh}
      />
    </>
  );
}
