import ExcelJS from 'exceljs';
import { EXPORTS_DIR, getExportFileName, getExportFilePath } from '../config/paths.js';
import { ensureDir } from '../utils/storage.js';
import { getWhatsAppLink } from '../utils/phone.js';
import { isLeadContacted } from '../utils/message.js';
import { Lead, LeadStatus } from '../types/index.js';

const STATUS_ROW_COLORS: Record<LeadStatus, string | null> = {
  'Nao Contatado': null,
  'Mensagem Enviada': 'FFE0F7FA',
  'Interessado': 'FFDBEAFE',
  'Proposta Enviada': 'FFE9D5FF',
  'Fechado': 'FFD1FAE5',
  'Perdido': 'FFFECACA',
};

export class ExportService {
  async exportToExcel(
    leads: Lead[],
    options?: { categoria?: string; sheetTitle?: string }
  ): Promise<{ filePath: string; fileName: string }> {
    await ensureDir(EXPORTS_DIR);

    const fileName = getExportFileName(options?.categoria);
    const filePath = getExportFilePath(options?.categoria);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LeadHunter';
    workbook.created = new Date();

    const sheetName = (options?.sheetTitle || options?.categoria || 'Leads').slice(0, 31);
    const sheet = workbook.addWorksheet(sheetName);

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

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

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

      const rowColor = STATUS_ROW_COLORS[lead.status];
      if (rowColor) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowColor },
          };
        });
      } else if (!isLeadContacted(lead)) {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
        });
      }

      row.getCell('mensagemProspeccao').alignment = { wrapText: true, vertical: 'top' };

      if (whatsappLink) {
        const whatsappCell = row.getCell('whatsapp');
        whatsappCell.value = {
          text: whatsappLink,
          hyperlink: whatsappLink,
        };
        whatsappCell.font = { color: { argb: 'FF25D366' }, underline: true };
      }
    }

    await workbook.xlsx.writeFile(filePath);
    console.log(`[Export] Excel gerado: ${filePath} (${leads.length} leads)`);

    return { filePath, fileName };
  }

  async exportAllByCategory(
    categories: { name: string; leads: Lead[] }[]
  ): Promise<{ fileName: string; count: number }[]> {
    const results: { fileName: string; count: number }[] = [];

    for (const { name, leads } of categories) {
      if (leads.length === 0) continue;
      const { fileName } = await this.exportToExcel(leads, {
        categoria: name,
        sheetTitle: name,
      });
      results.push({ fileName, count: leads.length });
    }

    return results;
  }
}

export const exportService = new ExportService();
