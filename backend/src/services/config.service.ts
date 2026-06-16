import { readJsonFile, writeJsonFile } from '../utils/storage.js';
import { CONFIG_FILE } from '../config/paths.js';
import { AppConfig } from '../types/index.js';

const DEFAULT_CONFIG: AppConfig = {
  googlePlacesApiKey: '',
  defaultCity: 'Cuiabá',
  defaultState: 'MT',
  maxResults: 60,
  topProspects: 20,
};

export class ConfigService {
  async getConfig(): Promise<AppConfig> {
    return readJsonFile<AppConfig>(CONFIG_FILE, DEFAULT_CONFIG);
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const config = await this.getConfig();
    const updated = { ...config, ...updates };
    await writeJsonFile(CONFIG_FILE, updated);
    return updated;
  }

  async getApiKey(): Promise<string> {
    const config = await this.getConfig();
    return config.googlePlacesApiKey;
  }
}

export const configService = new ConfigService();
