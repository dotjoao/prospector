import { useState } from 'react';
import { Eye, Star, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadDetailDialog } from '@/components/LeadDetailDialog';
import { ContactPhone } from '@/components/ContactPhone';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Lead } from '@/types';
import { cn, getPrioridadeColor, getStatusColor, getLeadPriorityScore, getStrategyPriorityColor, getStrategyTypeBadgeColor, getStrategyTypeLabel } from '@/lib/utils';

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
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner text="Carregando leads..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">
            {title} ({displayTotal})
          </CardTitle>
          {onPageChange && displayTotal > pageSize && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>
                Página {page} de {totalPages}
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
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado. Use &quot;Encontrar Oportunidades&quot; para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead, index) => {
                const priorityScore = getLeadPriorityScore(lead);
                return (
                <div
                  key={lead.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent/50 cursor-pointer',
                    highlightTop && index < highlightTop && 'border-primary/30 bg-primary/5',
                    getStrategyPriorityColor(priorityScore)
                  )}
                  onClick={() => openLead(lead)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{lead.empresa}</span>
                      {highlightTop && index < highlightTop && (
                        <Badge variant="outline" className="text-xs border-primary/50 text-primary">
                          Top #{index + 1}
                        </Badge>
                      )}
                      <Badge className={cn('border text-xs', getPrioridadeColor(lead.prioridade))}>
                        {lead.prioridade}
                      </Badge>
                      {lead.leadStrategyType && (
                        <Badge className={cn('border text-xs', getStrategyTypeBadgeColor(lead.leadStrategyType))}>
                          {getStrategyTypeLabel(lead.leadStrategyType)}
                        </Badge>
                      )}
                      <Badge className={cn('text-xs', getStatusColor(lead.status))}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>{lead.categoria}</span>
                      <span>{lead.cidade}</span>
                      {lead.telefone ? (
                        <ContactPhone phone={lead.telefone} lead={lead} />
                      ) : (
                        <span className="text-muted-foreground">Sem telefone</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {lead.website ? 'Com site' : 'Sem site'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400" />
                        {lead.nota} ({lead.avaliacoes})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{priorityScore}</div>
                      <div className="text-xs text-muted-foreground">score final</div>
                      <div className="text-[10px] text-muted-foreground">site: {lead.siteScore ?? lead.score}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openLead(lead); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LeadDetailDialog
        lead={selectedLead}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={onRefresh}
      />
    </>
  );
}
