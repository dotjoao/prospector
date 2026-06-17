import { useState } from 'react';
import { Eye, Star, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LeadDetailDialog } from '@/components/LeadDetailDialog';
import { ContactPhone } from '@/components/ContactPhone';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Lead } from '@/types';
import { cn, getPrioridadeColor, getStatusColor } from '@/lib/utils';

interface LeadTableProps {
  leads: Lead[];
  loading?: boolean;
  title?: string;
  highlightTop?: number;
  onRefresh: () => void;
}

export function LeadTable({ leads, loading, title = 'Leads', highlightTop, onRefresh }: LeadTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        <CardHeader>
          <CardTitle className="text-base">
            {title} ({leads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum lead encontrado. Use "Encontrar Oportunidades" para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead, index) => (
                <div
                  key={lead.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-colors hover:bg-accent/50 cursor-pointer',
                    highlightTop && index < highlightTop && 'border-primary/30 bg-primary/5'
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
                      <Badge className={cn('text-xs', getStatusColor(lead.status))}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{lead.categoria}</span>
                      <span>{lead.cidade}</span>
                      {lead.telefone ? (
                        <ContactPhone phone={lead.telefone} />
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
                      <div className="text-lg font-bold text-primary">{lead.score}</div>
                      <div className="text-xs text-muted-foreground">score</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openLead(lead); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
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
