-- LeadHunter - Usuários e sessões de autenticação

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================
-- TABELA: app_users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credencial padrão: admin / leadhunter123
INSERT INTO public.app_users (username, password_hash)
VALUES ('admin', extensions.crypt('leadhunter123', extensions.gen_salt('bf')))
ON CONFLICT (username) DO UPDATE
SET password_hash = EXCLUDED.password_hash;

-- ============================================================
-- TABELA: auth_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON public.auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires ON public.auth_sessions (expires_at);

-- ============================================================
-- FUNÇÃO: verificar login (senha com pgcrypto)
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_user_login(p_username TEXT, p_password TEXT)
RETURNS TABLE(user_id UUID, username TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username
  FROM public.app_users u
  WHERE lower(u.username) = lower(trim(p_username))
    AND u.is_active = TRUE
    AND u.password_hash = extensions.crypt(p_password, u.password_hash);
END;
$$;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access app_users" ON public.app_users;
CREATE POLICY "Service role full access app_users"
  ON public.app_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access auth_sessions" ON public.auth_sessions;
CREATE POLICY "Service role full access auth_sessions"
  ON public.auth_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
