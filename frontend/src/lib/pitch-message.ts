function normalizeCategory(categoria: string): string {
  return categoria
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const HEALTH_PATTERN =
  /nutri|medic|dentist|odontolog|fisio|psico|veterin|fonoaud|enferm|terapeut|clinic|hospital|saude|ginecolog|urolog|cardiolog|dermatolog|ortoped|pediatr|oftalmolog|otorrino|nutrolog|endocrin|acupuntur|quiroprax|osteopat|homeopat|podolog|optometr|farmaceut|biomed|estetic|spa|massag|pilates|yoga|personal trainer|crossfit|academia/;

const EDUCATION_PATTERN =
  /professor|escola|curso|ensino|educacao|coaching|coach|tutor|idioma|faculdade|universidade|creche|bercario/;

const HOSPITALITY_PATTERN = /hotel|pousada|hostel|resort|hospedagem/;

export function getAudienceTerm(categoria: string): string {
  const cat = normalizeCategory(categoria);
  if (HEALTH_PATTERN.test(cat)) return 'pacientes';
  if (EDUCATION_PATTERN.test(cat)) return 'alunos';
  if (HOSPITALITY_PATTERN.test(cat)) return 'hóspedes';
  return 'clientes';
}

export function getProfessionPlural(categoria: string): string {
  const cat = normalizeCategory(categoria);

  const mappings: [RegExp, string][] = [
    [/nutri/, 'nutricionistas'],
    [/advogad|juridic/, 'advogados'],
    [/dentist|odontolog/, 'dentistas'],
    [/medic|clinic/, 'médicos'],
    [/psico/, 'psicólogos'],
    [/fisio/, 'fisioterapeutas'],
    [/veterin/, 'veterinários'],
    [/fonoaud/, 'fonoaudiólogos'],
    [/enferm/, 'enfermeiros'],
    [/contador|contabil/, 'contadores'],
    [/arquitet/, 'arquitetos'],
    [/engenheir/, 'engenheiros'],
    [/personal trainer|personal/, 'personal trainers'],
    [/estetic/, 'profissionais de estética'],
    [/restaurante|lanchonete|pizzaria|hamburguer|bar\b|cafeteria/, 'restaurantes'],
    [/salao|cabeleireir|barbearia/, 'salões de beleza'],
    [/imobiliar|corretor/, 'corretores de imóveis'],
  ];

  for (const [pattern, label] of mappings) {
    if (pattern.test(cat)) return label;
  }

  const trimmed = categoria.trim();
  if (!trimmed) return 'profissionais do seu segmento';

  return trimmed.toLowerCase();
}

function getPraiseLine(categoria: string, audience: string): string {
  const cat = normalizeCategory(categoria);

  if (/advogad|juridic/.test(cat)) {
    return `Vi seu trabalho e gostei bastante da forma como você conduz sua advocacia. Dá para perceber o comprometimento com seus ${audience} e a preocupação em entregar um serviço de qualidade.`;
  }

  if (HEALTH_PATTERN.test(cat)) {
    return `Vi seu trabalho e gostei bastante da forma como você conduz seu atendimento. Dá para perceber o comprometimento com seus ${audience} e a preocupação em entregar um acompanhamento de qualidade.`;
  }

  if (EDUCATION_PATTERN.test(cat)) {
    return `Vi seu trabalho e gostei bastante da forma como você conduz suas aulas. Dá para perceber o comprometimento com seus ${audience} e a preocupação em entregar um ensino de qualidade.`;
  }

  return `Vi seu trabalho e gostei bastante da forma como você conduz seu atendimento. Dá para perceber o comprometimento com seus ${audience} e a preocupação em entregar um serviço de qualidade.`;
}

export function buildPitchMessage(categoria: string): string {
  const audience = getAudienceTerm(categoria);
  const profession = getProfessionPlural(categoria);
  const praise = getPraiseLine(categoria, audience);

  return `${praise}

Trabalho desenvolvendo sites personalizados para ${profession} e acredito que um site profissional pode reforçar ainda mais a sua autoridade e facilitar para que novos ${audience} conheçam seu trabalho.

Posso te mostrar uma ideia rápida?`;
}
