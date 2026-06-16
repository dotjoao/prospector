import { Router, Request, Response } from 'express';
import { leadsService } from '../services/leads.service.js';
import { opportunitiesService } from '../services/opportunities.service.js';
import { exportService } from '../services/export.service.js';
import { configService } from '../services/config.service.js';
import { generateProspectionMessage } from '../utils/message.js';
import { LeadFilters, SearchParams } from '../types/index.js';

const router = Router();

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'LeadHunter API' });
});

router.get('/config', async (_req: Request, res: Response) => {
  try {
    const config = await configService.getConfig();
    res.json({
      ...config,
      googlePlacesApiKey: config.googlePlacesApiKey ? '***configured***' : '',
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/config', async (req: Request, res: Response) => {
  try {
    const config = await configService.updateConfig(req.body);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const stats = await leadsService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/leads', async (req: Request, res: Response) => {
  try {
    const filters: LeadFilters = {
      cidade: req.query.cidade as string,
      categoria: req.query.categoria as string,
      possuiSite:
        req.query.possuiSite === 'true'
          ? true
          : req.query.possuiSite === 'false'
            ? false
            : undefined,
      scoreMinimo: req.query.scoreMinimo
        ? Number(req.query.scoreMinimo)
        : undefined,
      prioridade: req.query.prioridade as LeadFilters['prioridade'],
      status: req.query.status as LeadFilters['status'],
      busca: req.query.busca as string,
    };

    const leads = await leadsService.filterLeads(filters);
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await leadsService.getLeadById(getParamId(req));
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await leadsService.updateLead(getParamId(req), req.body);
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/leads/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await leadsService.deleteLead(getParamId(req));
    if (!deleted) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/opportunities/find', async (req: Request, res: Response) => {
  try {
    const params: SearchParams = {
      cidade: req.body.cidade,
      estado: req.body.estado,
      categoria: req.body.categoria,
    };

    if (!params.cidade || !params.estado || !params.categoria) {
      res.status(400).json({
        error: 'Campos obrigatórios: cidade, estado, categoria',
      });
      return;
    }

    const result = await opportunitiesService.findOpportunities(params);
    res.json(result);
  } catch (error) {
    console.error('[API] Erro ao buscar oportunidades:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/leads/:id/message', async (req: Request, res: Response) => {
  try {
    const lead = await leadsService.getLeadById(getParamId(req));
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado' });
      return;
    }
    const message = generateProspectionMessage(lead);
    res.json({ message });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/export/excel', async (_req: Request, res: Response) => {
  try {
    const leads = await leadsService.getAllLeads();
    const filePath = await exportService.exportToExcel(leads);
    res.json({
      success: true,
      filePath,
      count: leads.length,
      downloadUrl: '/api/export/download',
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/export/download', async (_req: Request, res: Response) => {
  try {
    const leads = await leadsService.getAllLeads();
    await exportService.exportToExcel(leads);
    res.download(
      (await import('../config/paths.js')).EXPORT_FILE,
      'leads.xlsx'
    );
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
