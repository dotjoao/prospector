import { readJsonFile, writeJsonFile } from '../utils/storage.js';

import { LEADS_FILE, CONFIG_FILE } from '../config/paths.js';

import { getPersistenceMode } from '../lib/persistence.js';

import { supabaseLeadsRepository } from '../repositories/leads.repository.js';

import { storageLeadsRepository } from '../repositories/storage-json.repository.js';

import { Lead, LeadFilters, DashboardStats, UpdateLeadPayload, PaginatedLeads } from '../types/index.js';

import { isLeadContacted } from '../utils/message.js';
import { enrichLeadStrategy, getLeadSortScore } from '../lib/strategy-engine.js';
import { matchesExactFilter } from '../lib/lead-presence.js';



const DEFAULT_PAGE_SIZE = 50;



function paginateInMemory(leads: Lead[], filters: LeadFilters): PaginatedLeads {

  const page = Math.max(1, filters.page ?? 1);

  const limit = Math.min(Math.max(1, filters.limit ?? DEFAULT_PAGE_SIZE), 100);

  const from = (page - 1) * limit;

  return {

    leads: leads.slice(from, from + limit),

    total: leads.length,

    page,

    limit,

  };

}



function filterInMemory(leads: Lead[], filters: LeadFilters): Lead[] {

  let result = [...leads];



  if (filters.busca) {

    const search = filters.busca.toLowerCase();

    result = result.filter((l) => l.empresa.toLowerCase().includes(search));

  }

  if (filters.cidade) {
    result = result.filter((l) => matchesExactFilter(l.cidade, filters.cidade!));
  }

  if (filters.categoria) {
    result = result.filter((l) => matchesExactFilter(l.categoria, filters.categoria!));
  }

  if (filters.possuiSite === true) {

    result = result.filter((l) => l.website && l.website.trim() !== '');

  } else if (filters.possuiSite === false) {

    result = result.filter((l) => !l.website || l.website.trim() === '');

  }

  if (filters.scoreMinimo !== undefined) {

    result = result.filter((l) => getLeadSortScore(l) >= filters.scoreMinimo!);

  }

  if (filters.prioridade) {

    result = result.filter((l) => l.prioridade === filters.prioridade);

  }

  if (filters.status) {

    result = result.filter((l) => l.status === filters.status);

  }



  return sortLeadsByPriority(result);

}

function enrichLeads(leads: Lead[]): Lead[] {
  return sortLeadsByPriority(leads.map(enrichLeadStrategy));
}

function sortLeadsByPriority(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => getLeadSortScore(b) - getLeadSortScore(a));
}



export class LeadsService {

  async getAllLeads(): Promise<Lead[]> {

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') return supabaseLeadsRepository.getAll();

    if (mode === 'supabase-storage') return enrichLeads(await storageLeadsRepository.getAll());

    return enrichLeads(await readJsonFile<Lead[]>(LEADS_FILE, []));

  }



  async getLeadById(id: string): Promise<Lead | undefined> {

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') return supabaseLeadsRepository.getById(id);

    if (mode === 'supabase-storage') return storageLeadsRepository.getById(id);

    const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);

    const found = leads.find((l) => l.id === id);
    return found ? enrichLeadStrategy(found) : undefined;

  }



  async saveLeads(leads: Lead[]): Promise<void> {

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') {

      await supabaseLeadsRepository.upsertMany(leads);

      return;

    }

    if (mode === 'supabase-storage') {

      await storageLeadsRepository.saveAll(leads);

      return;

    }

    await writeJsonFile(LEADS_FILE, leads);

  }



  async addLeads(newLeads: Lead[]): Promise<number> {

    const mode = getPersistenceMode();



    if (mode === 'supabase-db') {

      const inserted = await supabaseLeadsRepository.upsertMany(newLeads);

      console.log(`[Leads] ${inserted} novos leads adicionados (Supabase DB)`);

      return inserted;

    }



    if (mode === 'supabase-storage') {

      const inserted = await storageLeadsRepository.upsertMany(newLeads);

      console.log(`[Leads] ${inserted} novos leads adicionados (Supabase Storage)`);

      return inserted;

    }



    const existing = await readJsonFile<Lead[]>(LEADS_FILE, []);

    const existingPlaceIds = new Set(existing.map((l) => l.googleMapsUrl));

    const uniqueNewLeads = newLeads.filter((l) => !existingPlaceIds.has(l.googleMapsUrl));

    await writeJsonFile(LEADS_FILE, [...existing, ...uniqueNewLeads]);

    console.log(`[Leads] ${uniqueNewLeads.length} novos leads adicionados`);

    return uniqueNewLeads.length;

  }



  async updateLead(id: string, updates: UpdateLeadPayload): Promise<Lead | null> {

    const mode = getPersistenceMode();



    if (mode === 'supabase-db') {

      const lead = await supabaseLeadsRepository.update(id, updates);

      if (lead) console.log(`[Leads] Lead atualizado: ${id}`);

      return lead;

    }



    if (mode === 'supabase-storage') {

      const lead = await storageLeadsRepository.update(id, updates);

      if (lead) console.log(`[Leads] Lead atualizado: ${id}`);

      return lead;

    }



    const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);

    const index = leads.findIndex((l) => l.id === id);

    if (index === -1) return null;

    leads[index] = { ...leads[index], ...updates };

    await writeJsonFile(LEADS_FILE, leads);

    console.log(`[Leads] Lead atualizado: ${id}`);

    return leads[index];

  }



  async deleteLead(id: string): Promise<boolean> {

    const mode = getPersistenceMode();



    if (mode === 'supabase-db') {

      const deleted = await supabaseLeadsRepository.delete(id);

      if (deleted) console.log(`[Leads] Lead removido: ${id}`);

      return deleted;

    }



    if (mode === 'supabase-storage') {

      const deleted = await storageLeadsRepository.delete(id);

      if (deleted) console.log(`[Leads] Lead removido: ${id}`);

      return deleted;

    }



    const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);

    const filtered = leads.filter((l) => l.id !== id);

    if (filtered.length === leads.length) return false;

    await writeJsonFile(LEADS_FILE, filtered);

    console.log(`[Leads] Lead removido: ${id}`);

    return true;

  }



  async clearAllLeads(): Promise<number> {

    const mode = getPersistenceMode();



    if (mode === 'supabase-db') {

      const count = await supabaseLeadsRepository.deleteAll();

      console.log(`[Leads] ${count} leads removidos`);

      return count;

    }



    if (mode === 'supabase-storage') {

      const count = await storageLeadsRepository.deleteAll();

      console.log(`[Leads] ${count} leads removidos`);

      return count;

    }



    const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);

    const count = leads.length;

    await writeJsonFile(LEADS_FILE, []);

    console.log(`[Leads] ${count} leads removidos`);

    return count;

  }



  async getCategories(): Promise<{ name: string; count: number }[]> {

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') return supabaseLeadsRepository.getCategories();



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

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') return supabaseLeadsRepository.getByCategory(categoria);

    if (mode === 'supabase-storage') return storageLeadsRepository.getByCategory(categoria);



    const target = categoria.toLowerCase();

    const leads = await readJsonFile<Lead[]>(LEADS_FILE, []);

    return enrichLeads(
      leads.filter((l) => l.categoria?.toLowerCase() === target)
    );

  }



  async filterLeadsPaginated(filters: LeadFilters): Promise<PaginatedLeads> {

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') return supabaseLeadsRepository.filterPaginated(filters);



    const all = enrichLeads(
      mode === 'supabase-storage'
        ? await storageLeadsRepository.getAll()
        : await readJsonFile<Lead[]>(LEADS_FILE, [])
    );



    return paginateInMemory(filterInMemory(all, filters), filters);

  }



  async filterLeads(filters: LeadFilters): Promise<Lead[]> {

    const result = await this.filterLeadsPaginated({ ...filters, page: 1, limit: 10000 });

    return result.leads;

  }



  async getDashboardStats(): Promise<DashboardStats> {

    const mode = getPersistenceMode();

    if (mode === 'supabase-db') return supabaseLeadsRepository.getDashboardStats();



    const leads = await this.getAllLeads();

    const scoreOf = (l: Lead) => getLeadSortScore(l);

    return {

      totalLeads: leads.length,

      altaPrioridade: leads.filter((l) => scoreOf(l) >= 120).length,

      semSite: leads.filter((l) => !l.website || l.website.trim() === '').length,

      contatados: leads.filter(isLeadContacted).length,

      fechados: leads.filter((l) => l.status === 'Fechado').length,

      leadsQuentes: leads.filter((l) => scoreOf(l) >= 160).length,

      leadsMornos: leads.filter((l) => scoreOf(l) >= 120 && scoreOf(l) < 160).length,

      leadsFrios: leads.filter((l) => scoreOf(l) < 120).length,

    };

  }

}



export const leadsService = new LeadsService();

