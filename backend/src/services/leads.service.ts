import { readJsonFile, writeJsonFile } from '../utils/storage.js';
import { LEADS_FILE } from '../config/paths.js';
import { Lead, LeadFilters, DashboardStats, UpdateLeadPayload } from '../types/index.js';
import { isLeadContacted } from '../utils/message.js';

export class LeadsService {
  async getAllLeads(): Promise<Lead[]> {
    return readJsonFile<Lead[]>(LEADS_FILE, []);
  }

  async getLeadById(id: string): Promise<Lead | undefined> {
    const leads = await this.getAllLeads();
    return leads.find((l) => l.id === id);
  }

  async saveLeads(leads: Lead[]): Promise<void> {
    await writeJsonFile(LEADS_FILE, leads);
  }

  async addLeads(newLeads: Lead[]): Promise<Lead[]> {
    const existing = await this.getAllLeads();
    const existingPlaceIds = new Set(existing.map((l) => l.googleMapsUrl));

    const uniqueNewLeads = newLeads.filter(
      (l) => !existingPlaceIds.has(l.googleMapsUrl)
    );

    const merged = [...existing, ...uniqueNewLeads];
    await this.saveLeads(merged);
    console.log(`[Leads] ${uniqueNewLeads.length} novos leads adicionados`);
    return merged;
  }

  async updateLead(id: string, updates: UpdateLeadPayload): Promise<Lead | null> {
    const leads = await this.getAllLeads();
    const index = leads.findIndex((l) => l.id === id);

    if (index === -1) return null;

    leads[index] = { ...leads[index], ...updates };
    await this.saveLeads(leads);
    console.log(`[Leads] Lead atualizado: ${id}`);
    return leads[index];
  }

  async deleteLead(id: string): Promise<boolean> {
    const leads = await this.getAllLeads();
    const filtered = leads.filter((l) => l.id !== id);

    if (filtered.length === leads.length) return false;

    await this.saveLeads(filtered);
    console.log(`[Leads] Lead removido: ${id}`);
    return true;
  }

  async getCategories(): Promise<{ name: string; count: number }[]> {
    const leads = await this.getAllLeads();
    const counts = new Map<string, number>();

    for (const lead of leads) {
      const name = lead.categoria?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  async getLeadsByCategory(categoria: string): Promise<Lead[]> {
    const leads = await this.getAllLeads();
    const target = categoria.toLowerCase();
    return leads
      .filter((l) => l.categoria?.toLowerCase() === target)
      .sort((a, b) => b.score - a.score);
  }

  async filterLeads(filters: LeadFilters): Promise<Lead[]> {
    let leads = await this.getAllLeads();

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

    return leads.sort((a, b) => b.score - a.score);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const leads = await this.getAllLeads();

    return {
      totalLeads: leads.length,
      altaPrioridade: leads.filter(
        (l) => l.prioridade === 'Alta' || l.prioridade === 'Muito Alta'
      ).length,
      semSite: leads.filter((l) => !l.website || l.website.trim() === '').length,
      contatados: leads.filter(isLeadContacted).length,
      fechados: leads.filter((l) => l.status === 'Fechado').length,
    };
  }
}

export const leadsService = new LeadsService();
