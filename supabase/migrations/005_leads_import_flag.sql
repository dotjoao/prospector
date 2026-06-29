-- Evita reimportar leads.json/Storage após limpar o banco

ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS leads_file_import_done BOOLEAN NOT NULL DEFAULT FALSE;

-- Se já existem leads, marcar import como concluído
UPDATE public.app_settings
SET leads_file_import_done = TRUE
WHERE id = 1
  AND EXISTS (SELECT 1 FROM public.leads LIMIT 1);
