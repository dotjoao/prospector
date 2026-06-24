import { readJsonFile, writeJsonFile } from '../utils/storage.js';

import { CONFIG_FILE } from '../config/paths.js';

import { getPersistenceMode } from '../lib/persistence.js';

import { supabaseConfigRepository } from '../repositories/config.repository.js';

import { storageConfigRepository } from '../repositories/storage-json.repository.js';

import { AppConfig } from '../types/index.js';



const DEFAULT_CONFIG: AppConfig = {

  googlePlacesApiKey: '',

  defaultCity: 'Cuiabá',

  defaultState: 'MT',

  maxResults: 60,

  topProspects: 20,

  enableScreenshots: false,

};



const CONFIG_TTL_MS = 60_000;

let configCache: { data: AppConfig; at: number } | null = null;



export class ConfigService {

  async getConfig(): Promise<AppConfig> {

    if (configCache && Date.now() - configCache.at < CONFIG_TTL_MS) {

      return configCache.data;

    }



    const mode = getPersistenceMode();

    let config: AppConfig;



    if (mode === 'supabase-db') config = await supabaseConfigRepository.getConfig();

    else if (mode === 'supabase-storage') config = await storageConfigRepository.getConfig();

    else config = await readJsonFile<AppConfig>(CONFIG_FILE, DEFAULT_CONFIG);



    configCache = { data: config, at: Date.now() };

    return config;

  }



  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {

    const mode = getPersistenceMode();

    let updated: AppConfig;



    if (mode === 'supabase-db') updated = await supabaseConfigRepository.updateConfig(updates);

    else if (mode === 'supabase-storage') updated = await storageConfigRepository.updateConfig(updates);

    else {

      const config = await readJsonFile<AppConfig>(CONFIG_FILE, DEFAULT_CONFIG);

      updated = { ...config, ...updates };

      await writeJsonFile(CONFIG_FILE, updated);

    }



    configCache = { data: updated, at: Date.now() };

    return updated;

  }



  async getApiKey(): Promise<string> {

    const config = await this.getConfig();

    return config.googlePlacesApiKey;

  }

}



export const configService = new ConfigService();

