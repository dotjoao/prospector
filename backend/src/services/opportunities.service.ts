import { v4 as uuidv4 } from 'uuid';
import { googlePlacesService } from './google-places.service.js';
import { websiteAnalyzerService } from './website-analyzer.service.js';
import { screenshotService } from './screenshot.service.js';
import { leadsService } from './leads.service.js';
import { configService } from './config.service.js';
import { calculateScore, getPrioridade, extractCityFromAddress, extractStateFromAddress } from '../utils/score.js';
import { Lead, SearchParams, FindOpportunitiesResult } from '../types/index.js';

export class OpportunitiesService {
  async findOpportunities(params: SearchParams): Promise<FindOpportunitiesResult> {
    console.log('[Opportunities] Iniciando busca de oportunidades...');

    const places = await googlePlacesService.searchPlaces(params);
    const leads: Lead[] = [];

    for (const place of places) {
      try {
        const lead = await this.processPlace(place, params);
        leads.push(lead);
      } catch (err) {
        console.warn(`[Opportunities] Erro ao processar ${place.name}:`, err);
      }
    }

    leads.sort((a, b) => b.score - a.score);

    await leadsService.addLeads(leads);

    const config = await configService.getConfig();
    const topProspects = leads.slice(0, config.topProspects);

    console.log(`[Opportunities] Concluído: ${leads.length} leads, top ${topProspects.length}`);

    return {
      leads,
      totalFound: leads.length,
      topProspects,
      message: `${leads.length} oportunidades encontradas e analisadas`,
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
    params: SearchParams
  ): Promise<Lead> {
    const website = place.website || '';
    const analysis = await websiteAnalyzerService.analyze(website);

    if (website && analysis.siteStatus === 'Online') {
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
      avaliacoes: place.user_ratings_total || 0,
      nota: place.rating || 0,
    });

    const categoria =
      params.categoria ||
      (place.types?.[0]?.replace(/_/g, ' ') ?? 'Geral');

    return {
      id: uuidv4(),
      empresa: place.name,
      categoria,
      endereco: place.formatted_address,
      cidade: extractCityFromAddress(place.formatted_address) || params.cidade,
      estado: extractStateFromAddress(place.formatted_address) || params.estado,
      telefone: place.formatted_phone_number || '',
      website,
      nota: place.rating || 0,
      avaliacoes: place.user_ratings_total || 0,
      googleMapsUrl: place.url || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      dataColeta: new Date().toISOString(),
      score,
      prioridade: getPrioridade(score),
      status: 'Nao Contatado',
      websiteAnalysis: analysis,
    };
  }
}

export const opportunitiesService = new OpportunitiesService();
