import axios from 'axios';
import { configService } from './config.service.js';
import { GooglePlaceResult, SearchParams } from '../types/index.js';

interface TextSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
  }>;
  status: string;
  next_page_token?: string;
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: {
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    url?: string;
    types?: string[];
    place_id: string;
  };
  status: string;
  error_message?: string;
}

export class GooglePlacesService {
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  async searchPlaces(params: SearchParams): Promise<GooglePlaceResult[]> {
    const apiKey = await configService.getApiKey();

    if (!apiKey) {
      throw new Error(
        'API Key do Google Places não configurada. Configure em data/config.json'
      );
    }

    const query = `${params.categoria} ${params.cidade} ${params.estado}`;
    console.log(`[GooglePlaces] Buscando: "${query}"`);

    const allResults: GooglePlaceResult[] = [];
    let nextPageToken: string | undefined;

    do {
      const searchParams: Record<string, string> = {
        query,
        key: apiKey,
        language: 'pt-BR',
      };

      if (nextPageToken) {
        searchParams.pagetoken = nextPageToken;
        await this.delay(2000);
      }

      const response = await axios.get<TextSearchResponse>(
        `${this.baseUrl}/textsearch/json`,
        { params: searchParams, timeout: 15000 }
      );

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(
          `Google Places API erro: ${response.data.status} - ${response.data.error_message || ''}`
        );
      }

      for (const place of response.data.results || []) {
        try {
          const details = await this.getPlaceDetails(place.place_id, apiKey);
          if (details) {
            allResults.push(details);
          }
        } catch (err) {
          console.warn(`[GooglePlaces] Erro ao obter detalhes de ${place.name}:`, err);
        }
      }

      nextPageToken = response.data.next_page_token;

      const config = await configService.getConfig();
      if (allResults.length >= config.maxResults) break;
    } while (nextPageToken);

    console.log(`[GooglePlaces] ${allResults.length} empresas encontradas`);
    return allResults.slice(0, (await configService.getConfig()).maxResults);
  }

  private async getPlaceDetails(
    placeId: string,
    apiKey: string
  ): Promise<GooglePlaceResult | null> {
    const response = await axios.get<PlaceDetailsResponse>(
      `${this.baseUrl}/details/json`,
      {
        params: {
          place_id: placeId,
          key: apiKey,
          language: 'pt-BR',
          fields:
            'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,url,types,place_id',
        },
        timeout: 10000,
      }
    );

    if (response.data.status !== 'OK') {
      return null;
    }

    return response.data.result;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const googlePlacesService = new GooglePlacesService();
