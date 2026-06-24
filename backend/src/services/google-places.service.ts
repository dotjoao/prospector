import axios from 'axios';
import { configService } from './config.service.js';
import { GooglePlaceResult, SearchParams } from '../types/index.js';

interface NewPlace {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  types?: string[];
}

interface TextSearchNewResponse {
  places?: NewPlace[];
  nextPageToken?: string;
  error?: { message?: string; status?: string; code?: number };
}

interface GeocodeResponse {
  results?: { geometry?: { location?: { lat: number; lng: number } } }[];
  status?: string;
}

const SEARCH_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.googleMapsUri',
  'places.types',
  'nextPageToken',
].join(',');

export class GooglePlacesService {
  private baseUrl = 'https://places.googleapis.com/v1';

  async searchPlaces(params: SearchParams): Promise<GooglePlaceResult[]> {
    const apiKey = await configService.getApiKey();

    if (!apiKey) {
      throw new Error(
        'API Key do Google Places não configurada. Configure em data/config.json'
      );
    }

    const textQuery = `${params.categoria} em ${params.cidade}, ${params.estado}, Brasil`;
    console.log(`[GooglePlaces] Buscando (API New): "${textQuery}"`);

    const locationBias = await this.geocodeCity(apiKey, params.cidade, params.estado);

    const allResults: GooglePlaceResult[] = [];
    let pageToken: string | undefined;

    do {
      const body: Record<string, unknown> = {
        textQuery,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        pageSize: 20,
      };

      if (locationBias) {
        body.locationBias = locationBias;
      }

      if (pageToken) {
        body.pageToken = pageToken;
        await this.delay(2000);
      }

      const response = await axios.post<TextSearchNewResponse>(
        `${this.baseUrl}/places:searchText`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': SEARCH_FIELD_MASK,
          },
          timeout: 20000,
          validateStatus: () => true,
        }
      );

      if (response.status >= 400) {
        const apiError = response.data?.error;
        throw new Error(
          `Google Places API erro: ${apiError?.status || response.status} - ${apiError?.message || response.statusText}`
        );
      }

      if (response.data.error) {
        throw new Error(
          `Google Places API erro: ${response.data.error.status || response.data.error.code} - ${response.data.error.message || ''}`
        );
      }

      for (const place of response.data.places || []) {
        const mapped = this.mapPlace(place);
        if (mapped) {
          allResults.push(mapped);
        }
      }

      pageToken = response.data.nextPageToken;

      const config = await configService.getConfig();
      if (allResults.length >= config.maxResults) break;
    } while (pageToken);

    console.log(`[GooglePlaces] ${allResults.length} empresas encontradas`);
    return allResults.slice(0, (await configService.getConfig()).maxResults);
  }

  private async geocodeCity(
    apiKey: string,
    cidade: string,
    estado: string
  ): Promise<{ circle: { center: { latitude: number; longitude: number }; radius: number } } | null> {
    try {
      const address = `${cidade}, ${estado}, Brasil`;
      const response = await axios.get<GeocodeResponse>(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: { address, key: apiKey, language: 'pt-BR', region: 'br' },
          timeout: 10000,
        }
      );

      const location = response.data.results?.[0]?.geometry?.location;
      if (!location) {
        console.warn(`[GooglePlaces] Geocoding sem resultado para: ${address}`);
        return null;
      }

      console.log(`[GooglePlaces] Centro: ${cidade}/${estado} → ${location.lat}, ${location.lng}`);
      return {
        circle: {
          center: { latitude: location.lat, longitude: location.lng },
          radius: 40000,
        },
      };
    } catch (err) {
      console.warn('[GooglePlaces] Geocoding falhou:', (err as Error).message);
      return null;
    }
  }

  private mapPlace(place: NewPlace): GooglePlaceResult | null {
    if (!place.id || !place.displayName?.text) {
      return null;
    }

    const placeId = place.id.replace(/^places\//, '');

    return {
      place_id: placeId,
      name: place.displayName.text,
      formatted_address: place.formattedAddress || '',
      formatted_phone_number: place.nationalPhoneNumber || place.internationalPhoneNumber,
      website: place.websiteUri,
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      url: place.googleMapsUri,
      types: place.types,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const googlePlacesService = new GooglePlacesService();
