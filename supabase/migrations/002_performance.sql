-- LeadHunter - Funções de performance (stats e categorias no banco)

CREATE OR REPLACE FUNCTION public.leadhunter_dashboard_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'totalLeads', (SELECT COUNT(*)::int FROM public.leads),
    'altaPrioridade', (SELECT COUNT(*)::int FROM public.leads WHERE prioridade IN ('Alta', 'Muito Alta')),
    'semSite', (SELECT COUNT(*)::int FROM public.leads WHERE website IS NULL OR trim(website) = ''),
    'contatados', (SELECT COUNT(*)::int FROM public.leads WHERE status IN (
      'Mensagem Enviada', 'Interessado', 'Proposta Enviada', 'Fechado', 'Perdido'
    )),
    'fechados', (SELECT COUNT(*)::int FROM public.leads WHERE status = 'Fechado')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.leadhunter_category_counts()
RETURNS TABLE (name TEXT, count BIGINT) AS $$
  SELECT trim(categoria) AS name, COUNT(*)::bigint AS count
  FROM public.leads
  WHERE trim(categoria) <> ''
  GROUP BY trim(categoria)
  ORDER BY name;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.leadhunter_dashboard_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.leadhunter_category_counts() TO service_role;
