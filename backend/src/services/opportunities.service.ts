import { v4 as uuidv4 } from 'uuid';
import { googlePlacesService } from './google-places.service.js';
import { websiteAnalyzerService } from './website-analyzer.service.js';
import { screenshotService } from './screenshot.service.js';
import { leadsService } from './leads.service.js';
import { configService } from './config.service.js';
import { calculateScore, extractStateFromAddress } from '../utils/score.js';
import { applyStrategyToNewLead, getLeadSortScore } from '../lib/strategy-engine.js';
import { Lead, SearchParams, FindOpportunitiesResult } from '../types/index.js';

const ANALYSIS_CONCURRENCY = 10;

function countLeadsMatchingState(leads: Lead[], params: SearchParams): number {
  return leads.filter((lead) => {
    const addressState = extractStateFromAddress(lead.endereco);
    return !addressState || addressState === params.estado;
  }).length;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

export class OpportunitiesService {
  async findOpportunities(params: SearchParams): Promise<FindOpportunitiesResult> {
    console.log('[Opportunities] Iniciando busca de oportunidades...');

    const [places, config] = await Promise.all([
      googlePlacesService.searchPlaces(params),
      configService.getConfig(),
    ]);

    const leads = await mapWithConcurrency(places, ANALYSIS_CONCURRENCY, async (place) => {
      try {
        return await this.processPlace(place, params, config.enableScreenshots);
      } catch (err) {
        console.warn(`[Opportunities] Erro ao processar ${place.name}:`, err);
        return null;
      }
    });

    const validLeads = leads.filter((l): l is Lead => l !== null);
    validLeads.sort((a, b) => getLeadSortScore(b) - getLeadSortScore(a));

    const inserted = await leadsService.addLeads(validLeads);
    const matchingState = countLeadsMatchingState(validLeads, params);
    const topProspects = validLeads.slice(0, config.topProspects);

    let message = `${validLeads.length} encontrados em ${params.cidade}/${params.estado}. ${inserted} novos leads salvos.`;
    let warning: string | undefined;

    if (validLeads.length === 0) {
      message = `Nenhum resultado para ${params.categoria} em ${params.cidade}/${params.estado}. Verifique cidade, UF e categoria.`;
    } else if (inserted === 0) {
      message = `${validLeads.length} encontrados, mas todos já existiam na base (duplicados).`;
    } else if (matchingState < validLeads.length * 0.5) {
      warning = `Muitos endereços são de outro estado. Confira se a UF (${params.estado}) corresponde à cidade (${params.cidade}).`;
      message += ` ${warning}`;
    }

    console.log(`[Opportunities] Concluído: ${validLeads.length} leads, ${inserted} novos, top ${topProspects.length}`);

    return {
      leads: validLeads,
      totalFound: validLeads.length,
      newLeads: inserted,
      topProspects,
      message,
      warning,
    };
  }

  private async processPlace(
    place: {
      name: string;
      formatted_address: string;
      formatted_phone_number?: string;
      website?: string;
      rating?: number;
      user_ratings_total?: number;
      url?: string;
      types?: string[];
      place_id: string;
    },
    params: SearchParams,
    enableScreenshots: boolean
  ): Promise<Lead> {
    const website = place.website || '';
    const analysis = await websiteAnalyzerService.analyze(website);

    if (enableScreenshots && website && analysis.siteStatus === 'Online') {
      const screenshotPath = await screenshotService.capture(place.name, website);
      if (screenshotPath) {
        analysis.screenshotPath = screenshotPath;
      }
    }

    const score = calculateScore({
      website,
      siteStatus: analysis.siteStatus,
      hasWhatsapp: analysis.hasWhatsapp,
      hasForm: analysis.hasForm,
      isResponsive: analysis.isResponsive,
      hasHttps: analysis.hasHttps,
      avaliacoes: place.user_ratings_total || 0,
      nota: place.rating || 0,
    });

    const categoria =
      params.categoria ||
      (place.types?.[0]?.replace(/_/g, ' ') ?? 'Geral');

    const baseLead = {
      id: uuidv4(),
      empresa: place.name,
      categoria,
      endereco: place.formatted_address,
      cidade: params.cidade,
      estado: params.estado,
      telefone: place.formatted_phone_number || '',
      website,
      nota: place.rating || 0,
      avaliacoes: place.user_ratings_total || 0,
      googleMapsUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      dataColeta: new Date().toISOString(),
      score,
      status: 'Nao Contatado' as const,
      websiteAnalysis: analysis,
    };

    return applyStrategyToNewLead(baseLead);
  }
}

export const opportunitiesService = new OpportunitiesService();
