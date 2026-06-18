import ExcelJS from 'exceljs';
import { EXPORT_FILE, EXPORTS_DIR } from '../config/paths.js';
import { ensureDir } from '../utils/storage.js';
import { getWhatsAppLink } from '../utils/phone.js';
import { Lead } from '../types/index.js';

export class ExportService {
  async exportToExcel(leads: Lead[]): Promise<string> {
    await ensureDir(EXPORTS_DIR);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LeadHunter';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Leads');

    sheet.columns = [
      { header: 'Empresa', key: 'empresa', width: 30 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Cidade', key: 'cidade', width: 20 },
      { header: 'Telefone', key: 'telefone', width: 18 },
      { header: 'WhatsApp', key: 'whatsapp', width: 40 },
      { header: 'Website', key: 'website', width: 35 },
      { header: 'Avaliações', key: 'avaliacoes', width: 12 },
      { header: 'Nota', key: 'nota', width: 8 },
      { header: 'Score', key: 'score', width: 8 },
      { header: 'Prioridade', key: 'prioridade', width: 14 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Último Contato', key: 'ultimoContato', width: 16 },
      { header: 'Próximo Follow-up', key: 'proximoFollowUp', width: 18 },
      { header: 'Mensagem de Prospecção', key: 'mensagemProspeccao', width: 50 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    for (const lead of leads) {
      const whatsappLink = getWhatsAppLink(lead.telefone);

      const row = sheet.addRow({
        empresa: lead.empresa,
        categoria: lead.categoria,
        cidade: lead.cidade,
        telefone: lead.telefone,
        whatsapp: whatsappLink || '',
        website: lead.website,
        avaliacoes: lead.avaliacoes,
        nota: lead.nota,
        score: lead.score,
        prioridade: lead.prioridade,
        status: lead.status,
        ultimoContato: lead.ultimoContato || '',
        proximoFollowUp: lead.proximoFollowUp || '',
        mensagemProspeccao: lead.mensagemProspeccao || '',
      });

      if (whatsappLink) {
        const whatsappCell = row.getCell('whatsapp');
        whatsappCell.value = {
          text: whatsappLink,
          hyperlink: whatsappLink,
        };
        whatsappCell.font = { color: { argb: 'FF25D366' }, underline: true };
      }
    }

    await workbook.xlsx.writeFile(EXPORT_FILE);
    console.log(`[Export] Excel gerado: ${EXPORT_FILE} (${leads.length} leads)`);

    return EXPORT_FILE;
  }
}

export const exportService = new ExportService();
