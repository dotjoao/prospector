import { Router, Request, Response } from 'express';
import { leadsService } from '../services/leads.service.js';
import { opportunitiesService } from '../services/opportunities.service.js';
import { exportService } from '../services/export.service.js';
import { configService } from '../services/config.service.js';
import { authService } from '../services/auth.service.js';
import { generateProspectionMessage } from '../utils/message.js';
import { getPersistenceMode, getStorageLabel } from '../lib/persistence.js';
import { LeadFilters, SearchParams } from '../types/index.js';

const router = Router();

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
}

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username?.trim() || !password) {
      res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
      return;
    }

    const result = await authService.login(username.trim(), password);
    if (!result) {
      res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Não autenticado.' });
      return;
    }

    const user = await authService.validateToken(token);
    if (!user) {
      res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/auth/logout', async (req: Request, res: Response) => {
  try {
    const token = getBearerToken(req);
    if (token) await authService.logout(token);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  const mode = getPersistenceMode();
  res.json({
    status: 'ok',
    service: 'LeadHunter API',
    storage: getStorageLabel(mode),
    persistenceMode: mode,
  });
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
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    };

    const result = await leadsService.filterLeadsPaginated(filters);
    res.json(result);
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

router.delete('/leads', async (_req: Request, res: Response) => {
  try {
    const count = await leadsService.clearAllLeads();
    res.json({ success: true, count });
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

router.get('/export/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await leadsService.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/export/excel', async (req: Request, res: Response) => {
  try {
    const categoria = req.body.categoria as string | undefined;
    const leads = categoria
      ? await leadsService.getLeadsByCategory(categoria)
      : await leadsService.getAllLeads();

    if (categoria && leads.length === 0) {
      res.status(404).json({ error: `Nenhum lead encontrado para o tema "${categoria}"` });
      return;
    }

    const { fileName } = await exportService.exportToExcel(leads, {
      categoria,
      sheetTitle: categoria,
    });

    const downloadUrl = categoria
      ? `/api/export/download?categoria=${encodeURIComponent(categoria)}`
      : '/api/export/download';

    res.json({
      success: true,
      fileName,
      count: leads.length,
      categoria: categoria || null,
      downloadUrl,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/export/excel/all-themes', async (_req: Request, res: Response) => {
  try {
    const categories = await leadsService.getCategories();

    if (categories.length === 0) {
      res.status(404).json({ error: 'Nenhum tema encontrado para exportar' });
      return;
    }

    const exports = await exportService.exportAllByCategory(
      await Promise.all(
        categories.map(async (cat) => ({
          name: cat.name,
          leads: await leadsService.getLeadsByCategory(cat.name),
        }))
      )
    );

    res.json({
      success: true,
      totalThemes: exports.length,
      exports: exports.map((item) => ({
        ...item,
        downloadUrl: `/api/export/download?file=${encodeURIComponent(item.fileName)}`,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/export/download', async (req: Request, res: Response) => {
  try {
    const pathMod = await import('path');
    const { getExportFileName, EXPORTS_DIR } = await import('../config/paths.js');
    const categoria = req.query.categoria as string | undefined;
    const file = req.query.file as string | undefined;

    let fileName: string;

    if (file) {
      fileName = file.replace(/[^a-zA-Z0-9._-]/g, '');
    } else if (categoria) {
      const leads = await leadsService.getLeadsByCategory(categoria);
      await exportService.exportToExcel(leads, { categoria, sheetTitle: categoria });
      fileName = getExportFileName(categoria);
    } else {
      const leads = await leadsService.getAllLeads();
      await exportService.exportToExcel(leads);
      fileName = getExportFileName();
    }

    const filePath = pathMod.join(EXPORTS_DIR, fileName);
    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
