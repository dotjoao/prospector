import { readStorageJson, writeStorageJson, STORAGE_LEADS_PATH, STORAGE_CONFIG_PATH } from '../lib/supabase-storage.js';
import { Lead, AppConfig, LeadFilters, UpdateLeadPayload } from '../types/index.js';

const DEFAULT_CONFIG: AppConfig = {
  googlePlacesApiKey: '',
  defaultCity: 'Cuiabá',
  defaultState: 'MT',
  maxResults: 60,
  topProspects: 20,
  enableScreenshots: false,
};

export class StorageLeadsRepository {
  async getAll(): Promise<Lead[]> {
    const leads = await readStorageJson<Lead[]>(STORAGE_LEADS_PATH, []);
    return leads.sort((a, b) => b.score - a.score);
  }

  async getById(id: string): Promise<Lead | undefined> {
    const leads = await this.getAll();
    return leads.find((l) => l.id === id);
  }

  async saveAll(leads: Lead[]): Promise<void> {
    await writeStorageJson(STORAGE_LEADS_PATH, leads);
  }

  async upsertMany(newLeads: Lead[]): Promise<number> {
    if (newLeads.length === 0) return 0;
    const existing = await readStorageJson<Lead[]>(STORAGE_LEADS_PATH, []);
    const existingUrls = new Set(existing.map((l) => l.googleMapsUrl));
    const unique = newLeads.filter((l) => !existingUrls.has(l.googleMapsUrl));
    if (unique.length === 0) return 0;
    await this.saveAll([...existing, ...unique]);
    return unique.length;
  }

  async update(id: string, updates: UpdateLeadPayload): Promise<Lead | null> {
    const leads = await readStorageJson<Lead[]>(STORAGE_LEADS_PATH, []);
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) return null;
    leads[index] = { ...leads[index], ...updates };
    await this.saveAll(leads);
    return leads[index];
  }

  async delete(id: string): Promise<boolean> {
    const leads = await readStorageJson<Lead[]>(STORAGE_LEADS_PATH, []);
    const filtered = leads.filter((l) => l.id !== id);
    if (filtered.length === leads.length) return false;
    await this.saveAll(filtered);
    return true;
  }

  async filter(filters: LeadFilters): Promise<Lead[]> {
    let leads = await this.getAll();

    if (filters.busca) {
      const search = filters.busca.toLowerCase();
      leads = leads.filter((l) => l.empresa.toLowerCase().includes(search));
    }
    if (filters.cidade) {
      const cidade = filters.cidade.toLowerCase();
      leads = leads.filter((l) => l.cidade.toLowerCase().includes(cidade));
    }
    if (filters.categoria) {
      const cat = filters.categoria.toLowerCase();
      leads = leads.filter((l) => l.categoria.toLowerCase().includes(cat));
    }
    if (filters.possuiSite === true) {
      leads = leads.filter((l) => l.website && l.website.trim() !== '');
    } else if (filters.possuiSite === false) {
      leads = leads.filter((l) => !l.website || l.website.trim() === '');
    }
    if (filters.scoreMinimo !== undefined) {
      leads = leads.filter((l) => l.score >= filters.scoreMinimo!);
    }
    if (filters.prioridade) {
      leads = leads.filter((l) => l.prioridade === filters.prioridade);
    }
    if (filters.status) {
      leads = leads.filter((l) => l.status === filters.status);
    }

    return leads;
  }

  async getByCategory(categoria: string): Promise<Lead[]> {
    const target = categoria.toLowerCase();
    const leads = await this.getAll();
    return leads.filter((l) => l.categoria?.toLowerCase() === target);
  }
}

export class StorageConfigRepository {
  async getConfig(): Promise<AppConfig> {
    return readStorageJson<AppConfig>(STORAGE_CONFIG_PATH, DEFAULT_CONFIG);
  }

  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const config = await this.getConfig();
    const updated = { ...config, ...updates };
    await writeStorageJson(STORAGE_CONFIG_PATH, updated);
    return updated;
  }
}

export const storageLeadsRepository = new StorageLeadsRepository();
export const storageConfigRepository = new StorageConfigRepository();
