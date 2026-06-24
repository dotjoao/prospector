-- LeadHunter - Schema inicial Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- Extensão para UUID (já habilitada por padrão no Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT '',
  endereco TEXT NOT NULL DEFAULT '',
  cidade TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  nota NUMERIC(3, 2) NOT NULL DEFAULT 0,
  avaliacoes INTEGER NOT NULL DEFAULT 0,
  google_maps_url TEXT NOT NULL,
  data_coleta TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score INTEGER NOT NULL DEFAULT 0,
  prioridade TEXT NOT NULL DEFAULT 'Baixa'
    CHECK (prioridade IN ('Baixa', 'Media', 'Alta', 'Muito Alta')),
  status TEXT NOT NULL DEFAULT 'Nao Contatado'
    CHECK (status IN (
      'Nao Contatado',
      'Mensagem Enviada',
      'Interessado',
      'Proposta Enviada',
      'Fechado',
      'Perdido'
    )),
  ultimo_contato DATE,
  proximo_follow_up DATE,
  observacoes TEXT,
  mensagem_prospeccao TEXT,
  website_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_google_maps_url_unique UNIQUE (google_maps_url)
);

CREATE INDEX IF NOT EXISTS idx_leads_categoria ON public.leads (categoria);
CREATE INDEX IF NOT EXISTS idx_leads_cidade ON public.leads (cidade);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_prioridade ON public.leads (prioridade);
CREATE INDEX IF NOT EXISTS idx_leads_score ON public.leads (score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_empresa ON public.leads USING gin (to_tsvector('portuguese', empresa));

-- ============================================================
-- TABELA: app_settings (configuração singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  google_places_api_key TEXT NOT NULL DEFAULT '',
  default_city TEXT NOT NULL DEFAULT 'Cuiabá',
  default_state TEXT NOT NULL DEFAULT 'MT',
  max_results INTEGER NOT NULL DEFAULT 60 CHECK (max_results > 0 AND max_results <= 200),
  top_prospects INTEGER NOT NULL DEFAULT 20 CHECK (top_prospects > 0 AND top_prospects <= 100),
  enable_screenshots BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS (Row Level Security) - backend usa service_role
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas apenas para service_role (anon bloqueado por padrão)
CREATE POLICY "Service role full access leads"
  ON public.leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access settings"
  ON public.app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
