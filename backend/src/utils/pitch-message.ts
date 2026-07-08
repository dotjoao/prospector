import { getTimeGreeting } from './message.js';

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

export interface PitchContext {
  categoria: string;
  cidade: string;
}

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

function getHelpTarget(categoria: string): string {
  const cat = normalizeCategory(categoria);
  if (HEALTH_PATTERN.test(cat)) return 'profissionais da saúde';
  return getProfessionPlural(categoria);
}

export function getProfessionSingularForSearch(categoria: string): string {
  const cat = normalizeCategory(categoria);

  const mappings: [RegExp, string][] = [
    [/nutri/, 'nutricionista'],
    [/advogad|juridic/, 'advogado'],
    [/dentist|odontolog/, 'dentista'],
    [/medic/, 'médico'],
    [/psico/, 'psicólogo'],
    [/fisio/, 'fisioterapeuta'],
    [/veterin/, 'veterinário'],
    [/fonoaud/, 'fonoaudiólogo'],
    [/enferm/, 'enfermeiro'],
    [/contador|contabil/, 'contador'],
    [/arquitet/, 'arquiteto'],
    [/personal trainer|personal/, 'personal trainer'],
    [/estetic/, 'profissional de estética'],
    [/restaurante|lanchonete|pizzaria/, 'restaurante'],
    [/salao|cabeleireir|barbearia/, 'salão de beleza'],
    [/imobiliar|corretor/, 'corretor de imóveis'],
    [/professor|escola|curso/, 'professor'],
  ];

  for (const [pattern, label] of mappings) {
    if (pattern.test(cat)) return label;
  }

  const trimmed = categoria.trim().toLowerCase();
  return trimmed || 'seu serviço';
}

export function getSearchExample(categoria: string, cidade: string): string {
  const profession = getProfessionSingularForSearch(categoria);
  const city = cidade.trim() || 'sua cidade';
  return `${profession} em ${city}`;
}

export function buildPitchMessage(context: PitchContext, date: Date = new Date()): string {
  const greeting = getTimeGreeting(date);
  const audience = getAudienceTerm(context.categoria);
  const searchExample = getSearchExample(context.categoria, context.cidade);
  const helpTarget = getHelpTarget(context.categoria);

  return `${greeting}! Tudo bem?

Me chamo João, sou desenvolvedor de sites. Encontrei seu perfil enquanto pesquisava por profissionais da sua área e gostei muito do seu trabalho. Dá para perceber o cuidado que você tem com seus ${audience} e a forma profissional como conduz seu atendimento.

Hoje ajudo ${helpTarget} a terem um site próprio, que além de transmitir mais confiança, facilita que novos ${audience} encontrem seu trabalho quando pesquisam no Google, por exemplo: "${searchExample}" ou pelo serviço que você oferece na sua região.

Acredito que isso faria bastante sentido para o seu trabalho. Posso te mostrar uma ideia rápida?`;
}
