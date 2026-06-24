import {
  getSupabase,
  settingsToConfig,
  configToSettings,
  AppSettingsRow,
} from '../lib/supabase.js';
import { AppConfig } from '../types/index.js';

const DEFAULT_CONFIG: AppConfig = {
  googlePlacesApiKey: '',
  defaultCity: 'Cuiabá',
  defaultState: 'MT',
  maxResults: 60,
  topProspects: 20,
  enableScreenshots: false,
};

export class SupabaseConfigRepository {
  async getConfig(): Promise<AppConfig> {
    const { data, error } = await getSupabase()
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw new Error(`[Supabase] Erro ao ler config: ${error.message}`);
    if (!data) return DEFAULT_CONFIG;
    return settingsToConfig(data as AppSettingsRow);
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const payload = configToSettings(updates);
    const { data, error } = await getSupabase()
      .from('app_settings')
      .update(payload)
      .eq('id', 1)
      .select('*')
      .single();

    if (error) throw new Error(`[Supabase] Erro ao salvar config: ${error.message}`);
    return settingsToConfig(data as AppSettingsRow);
  }
}

export const supabaseConfigRepository = new SupabaseConfigRepository();
