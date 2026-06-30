-- LeadHunter Strategy Engine - campos de estratégia comercial

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS city_tier TEXT DEFAULT 'TIER_3',
  ADD COLUMN IF NOT EXISTS niche_intent_score INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS site_score INTEGER,
  ADD COLUMN IF NOT EXISTS lead_score_final INTEGER,
  ADD COLUMN IF NOT EXISTS lead_strategy_type TEXT DEFAULT 'AUTHORITY',
  ADD COLUMN IF NOT EXISTS message_variant TEXT;

-- Backfill: site_score = score legado
UPDATE public.leads
SET site_score = score
WHERE site_score IS NULL;

CREATE INDEX IF NOT EXISTS idx_leads_score_final ON public.leads (lead_score_final DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_strategy ON public.leads (lead_strategy_type);

-- Dashboard com prioridade estratégica
CREATE OR REPLACE FUNCTION public.leadhunter_dashboard_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'totalLeads', (SELECT COUNT(*)::int FROM public.leads),
    'altaPrioridade', (SELECT COUNT(*)::int FROM public.leads WHERE COALESCE(lead_score_final, score) >= 120),
    'semSite', (SELECT COUNT(*)::int FROM public.leads WHERE website IS NULL OR trim(website) = ''),
    'contatados', (SELECT COUNT(*)::int FROM public.leads WHERE status IN (
      'Mensagem Enviada', 'Interessado', 'Proposta Enviada', 'Fechado', 'Perdido'
    )),
    'fechados', (SELECT COUNT(*)::int FROM public.leads WHERE status = 'Fechado'),
    'leadsQuentes', (SELECT COUNT(*)::int FROM public.leads WHERE COALESCE(lead_score_final, score) >= 160),
    'leadsMornos', (SELECT COUNT(*)::int FROM public.leads WHERE COALESCE(lead_score_final, score) >= 120 AND COALESCE(lead_score_final, score) < 160),
    'leadsFrios', (SELECT COUNT(*)::int FROM public.leads WHERE COALESCE(lead_score_final, score) < 120)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;
