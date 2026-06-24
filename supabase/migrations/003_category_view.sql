-- LeadHunter - View para contagem de categorias (usada pela API)

CREATE OR REPLACE VIEW public.leads_category_counts AS
SELECT trim(categoria) AS name, COUNT(*)::bigint AS count
FROM public.leads
WHERE trim(categoria) <> ''
GROUP BY trim(categoria);

GRANT SELECT ON public.leads_category_counts TO service_role;
