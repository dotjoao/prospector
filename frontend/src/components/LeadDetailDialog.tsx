import { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Star,
  Globe,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ContactPhone } from '@/components/ContactPhone';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api, LEAD_STATUSES } from '@/services/api';
import { Lead, LeadStatus } from '@/types';
import {
  cn,
  getPrioridadeColor,
  getStatusColor,
} from '@/lib/utils';

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function LeadDetailDialog({ lead, open, onOpenChange, onUpdate }: LeadDetailDialogProps) {
  const [status, setStatus] = useState<LeadStatus>('Nao Contatado');
  const [ultimoContato, setUltimoContato] = useState('');
  const [proximoFollowUp, setProximoFollowUp] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setUltimoContato(lead.ultimoContato?.split('T')[0] || '');
      setProximoFollowUp(lead.proximoFollowUp?.split('T')[0] || '');
      setObservacoes(lead.observacoes || '');
      setMessage('');
    }
  }, [lead]);

  async function handleSave() {
    if (!lead) return;
    setSaving(true);
    try {
      await api.updateLead(lead.id, {
        status,
        ultimoContato: ultimoContato || undefined,
        proximoFollowUp: proximoFollowUp || undefined,
        observacoes,
      });
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateMessage() {
    if (!lead) return;
    setLoadingMessage(true);
    try {
      const result = await api.generateMessage(lead.id);
      setMessage(result.message);
    } finally {
      setLoadingMessage(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!lead) return null;

  const analysis = lead.websiteAnalysis;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{lead.empresa}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 flex-wrap">
            <Badge className={cn('border', getPrioridadeColor(lead.prioridade))}>
              {lead.prioridade}
            </Badge>
            <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
            <span className="text-sm">Score: <strong>{lead.score}</strong></span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{lead.cidade}, {lead.estado}</span>
            </div>
            <div className="flex items-center gap-2">
              <ContactPhone phone={lead.telefone} size="md" />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                  {lead.website}
                </a>
              ) : (
                <span className="text-muted-foreground">Sem site</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>{lead.nota} ({lead.avaliacoes} avaliações)</span>
            </div>
          </div>

          {analysis && (
            <div className="rounded-lg border p-3 space-y-2">
              <h4 className="font-medium text-sm">Análise do Site</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span>Status: <strong>{analysis.siteStatus}</strong></span>
                <span>HTTPS: <strong>{analysis.hasHttps ? 'Sim' : 'Não'}</strong></span>
                <span>Responsivo: <strong>{analysis.isResponsive ? 'Sim' : 'Não'}</strong></span>
                <span>WhatsApp: <strong>{analysis.hasWhatsapp ? 'Sim' : 'Não'}</strong></span>
                <span>Formulário: <strong>{analysis.hasForm ? 'Sim' : 'Não'}</strong></span>
              </div>
              {analysis.screenshotPath && (
                <img
                  src={analysis.screenshotPath}
                  alt={`Screenshot ${lead.empresa}`}
                  className="rounded-md border mt-2 w-full max-h-48 object-cover object-top"
                />
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm">CRM</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Último Contato</Label>
                <Input type="date" value={ultimoContato} onChange={(e) => setUltimoContato(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Próximo Follow-up</Label>
                <Input type="date" value={proximoFollowUp} onChange={(e) => setProximoFollowUp(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações sobre o lead..."
                rows={3}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensagem de Prospecção
              </h4>
              <Button variant="outline" size="sm" onClick={handleGenerateMessage} disabled={loadingMessage}>
                {loadingMessage ? 'Gerando...' : 'Gerar Mensagem'}
              </Button>
            </div>
            {message && (
              <div className="relative">
                <Textarea value={message} readOnly rows={8} className="pr-12" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Google Maps
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
