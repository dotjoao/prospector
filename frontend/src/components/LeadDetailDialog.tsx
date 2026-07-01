import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Star,
  Globe,
  MapPin,
  Brain,
  BarChart3,
  ClipboardList,
  Instagram,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ContactPhone } from '@/components/ContactPhone';
import { InstagramButton } from '@/components/InstagramButton';
import { WhatsAppMenu } from '@/components/WhatsAppMenu';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  getStatusColor,
  getLeadPriorityScore,
  getStrategyTypeBadgeColor,
  getStrategyTypeLabel,
  getStrategyPriorityLabel,
} from '@/lib/utils';
import {
  getInstagramUrl,
  getPresenceLabel,
  hasProfessionalWebsite,
  normalizeInstagramUrl,
} from '@/lib/lead-presence';

interface LeadDetailDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-secondary/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <Icon className="h-4 w-4 text-primary" />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function LeadDetailDialog({ lead, open, onOpenChange, onUpdate }: LeadDetailDialogProps) {
  const [displayLead, setDisplayLead] = useState<Lead | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [status, setStatus] = useState<LeadStatus>('Nao Contatado');
  const [ultimoContato, setUltimoContato] = useState('');
  const [proximoFollowUp, setProximoFollowUp] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!lead || !open) {
      if (!open) {
        setDisplayLead(null);
        setLoadingDetail(false);
      }
      return;
    }

    setDisplayLead(lead);
    setStatus(lead.status);
    setUltimoContato(lead.ultimoContato?.split('T')[0] || '');
    setProximoFollowUp(lead.proximoFollowUp?.split('T')[0] || '');
    setObservacoes(lead.observacoes || '');
    setMensagem(lead.mensagemProspeccao || '');
    setSaveSuccess(false);
    setLoadingDetail(true);

    let cancelled = false;
    api.getLead(lead.id)
      .then((full) => {
        if (!cancelled) {
          setDisplayLead(full);
          setStatus(full.status);
          setUltimoContato(full.ultimoContato?.split('T')[0] || '');
          setProximoFollowUp(full.proximoFollowUp?.split('T')[0] || '');
          setObservacoes(full.observacoes || '');
          setMensagem(full.mensagemProspeccao || '');
        }
      })
      .catch(() => {
        // mantém dados da lista
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });

    return () => { cancelled = true; };
  }, [lead, open]);

  async function handleSave() {
    if (!lead) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateLead(lead.id, {
        status,
        ultimoContato: ultimoContato || undefined,
        proximoFollowUp: proximoFollowUp || undefined,
        observacoes,
        mensagemProspeccao: mensagem,
      });
      setSaveSuccess(true);
      onUpdate();
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateMessage() {
    if (!lead) return;
    setLoadingMessage(true);
    try {
      const result = await api.generateMessage(lead.id);
      setMensagem(result.message);
    } finally {
      setLoadingMessage(false);
    }
  }

  async function handleCopy() {
    if (!mensagem) return;
    await navigator.clipboard.writeText(mensagem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!lead) return null;

  const activeLead = displayLead ?? lead;
  const analysis = activeLead.websiteAnalysis;
  const finalScore = getLeadPriorityScore(activeLead);
  const tier = getStrategyPriorityLabel(finalScore);
  const instagramUrl = getInstagramUrl(activeLead);

  const tierColors = {
    quente: 'from-red-500/20 to-red-500/5 border-red-500/20 text-red-400',
    morno: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
    frio: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-white/10">
        <div className={cn('px-6 pt-6 pb-4 bg-gradient-to-br border-b', tierColors[tier])}>
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">{activeLead.empresa}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold">{finalScore}</span>
              <span className="text-xs opacity-70">score final</span>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm">Site: {activeLead.siteScore ?? activeLead.score}</span>
            <Badge variant="outline" className="text-xs border-white/20">
              {getPresenceLabel(activeLead)}
            </Badge>
            {activeLead.leadStrategyType && (
              <Badge className={cn('border', getStrategyTypeBadgeColor(activeLead.leadStrategyType))}>
                {getStrategyTypeLabel(activeLead.leadStrategyType)}
              </Badge>
            )}
            <Badge className={getStatusColor(activeLead.status)}>{activeLead.status}</Badge>
          </div>
        </div>

        {loadingDetail ? (
          <div className="py-12">
            <LoadingSpinner text="Carregando detalhes..." />
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <Section icon={Brain} title="Estratégia">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Cidade (tier)</span>
                  <p className="font-medium">{activeLead.cityTier ?? '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Intenção do nicho</span>
                  <p className="font-medium">{activeLead.nicheIntentScore ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground text-xs">Variante A/B</span>
                  <p className="font-medium font-mono text-xs">{activeLead.messageVariant ?? '—'}</p>
                </div>
              </div>
            </Section>

            <Section icon={BarChart3} title="Dados do lead">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{activeLead.endereco || `${activeLead.cidade}, ${activeLead.estado}`}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground text-xs shrink-0">Contato:</span>
                  {activeLead.telefone ? (
                    <ContactPhone phone={activeLead.telefone} size="md" />
                  ) : (
                    <span className="text-muted-foreground">Sem telefone</span>
                  )}
                </div>
                <div className="flex items-center gap-2 col-span-1 sm:col-span-2 flex-wrap">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  {hasProfessionalWebsite(activeLead) ? (
                    <a
                      href={activeLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate"
                    >
                      {activeLead.website}
                    </a>
                  ) : instagramUrl ? (
                    <a
                      href={normalizeInstagramUrl(instagramUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-400 hover:underline truncate flex items-center gap-1"
                    >
                      <Instagram className="h-3.5 w-3.5 shrink-0" />
                      {instagramUrl}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Sem site · {getPresenceLabel(activeLead)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>{activeLead.nota} ({activeLead.avaliacoes} avaliações)</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-muted-foreground text-xs">Categoria:</span>
                  <span className="font-medium">{activeLead.categoria}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/[0.06]">
                {activeLead.telefone && (
                  <WhatsAppMenu
                    phone={activeLead.telefone}
                    lead={activeLead}
                    pitchMessage={mensagem}
                    size="md"
                  />
                )}
                <InstagramButton lead={activeLead} size="md" />
              </div>

              {analysis && (
                <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <span>Presença: <strong>{analysis.siteStatus}</strong></span>
                  {hasProfessionalWebsite(activeLead) && (
                    <>
                      <span>HTTPS: <strong>{analysis.hasHttps ? 'Sim' : 'Não'}</strong></span>
                      <span>Mobile: <strong>{analysis.isResponsive ? 'Sim' : 'Não'}</strong></span>
                      <span>WhatsApp no site: <strong>{analysis.hasWhatsapp ? 'Sim' : 'Não'}</strong></span>
                      <span>Formulário: <strong>{analysis.hasForm ? 'Sim' : 'Não'}</strong></span>
                    </>
                  )}
                  {(analysis.hasInstagram || instagramUrl) && (
                    <span>Instagram: <strong>Sim</strong></span>
                  )}
                </div>
              )}
            </Section>

            <Section icon={ClipboardList} title="CRM">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
                    <SelectTrigger className="h-9 bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Último contato</Label>
                  <Input type="date" value={ultimoContato} onChange={(e) => setUltimoContato(e.target.value)} className="h-9 bg-background/50" />
                </div>
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <Label className="text-xs">Próximo follow-up</Label>
                  <Input type="date" value={proximoFollowUp} onChange={(e) => setProximoFollowUp(e.target.value)} className="h-9 bg-background/50" />
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                <Label className="text-xs">Observações</Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações..."
                  rows={2}
                  className="bg-background/50 resize-none"
                />
              </div>
            </Section>

            <Section icon={MessageSquare} title="Mensagem de prospecção">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={!mensagem.trim()}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copiar
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateMessage} disabled={loadingMessage}>
                  {loadingMessage ? 'Gerando...' : 'Gerar pitch'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                WhatsApp: 1. Saudação → aguarde → 2. Pitch (texto abaixo) → 3. Follow-up
              </p>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Mensagem 2 — pitch personalizado conforme presença digital do lead"
                rows={6}
                className="bg-background/50 text-sm resize-none"
              />
            </Section>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar alterações'}
              </Button>
              <Button variant="outline" asChild>
                <a href={activeLead.googleMapsUrl} target="_blank" rel="noopener noreferrer" title="Google Maps">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
