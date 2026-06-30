import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FolderDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api, resolveApiUrl } from '@/services/api';

export interface ThemeOption {
  name: string;
  count: number;
}

interface ExportPanelProps {
  themes: ThemeOption[];
  loading?: boolean;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

function downloadFile(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = resolveApiUrl(url);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ExportPanel({ themes, loading, onNotify }: ExportPanelProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  async function exportTheme(categoria: string) {
    setExporting(categoria);
    try {
      const result = await api.exportExcel(categoria);
      downloadFile(result.downloadUrl, result.fileName);
      onNotify('success', `Planilha "${categoria}" baixada (${result.count} leads)`);
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setExporting(null);
    }
  }

  async function exportAllInOne() {
    setExporting('all');
    try {
      const result = await api.exportExcel();
      downloadFile(result.downloadUrl, result.fileName);
      onNotify('success', `Planilha completa baixada (${result.count} leads)`);
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setExporting(null);
    }
  }

  async function exportAllSeparate() {
    setExporting('all-themes');
    try {
      const result = await api.exportAllThemes();
      for (const item of result.exports) {
        downloadFile(item.downloadUrl, item.fileName);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      onNotify('success', `${result.totalThemes} planilhas baixadas (uma por tema)`);
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <div className="glass-card py-12">
        <LoadingSpinner text="Carregando temas..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Exportar para Excel</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Leads salvos no banco. Baixe planilhas por categoria para prospecção offline.
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="font-semibold flex items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Planilhas por tema
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Cada busca cria um tema. Baixe a planilha que quiser trabalhar.
          </p>
        </div>
        <div className="p-5">
          {themes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum tema ainda. Vá em <strong>Prospectar</strong> e busque oportunidades
              (ex: Psicólogo, Personal Trainer).
            </p>
          ) : (
            <div className="rounded-lg border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="text-left p-3 font-medium">Tema</th>
                    <th className="text-center p-3 font-medium w-24">Leads</th>
                    <th className="text-left p-3 font-medium w-40">Arquivo</th>
                    <th className="text-right p-3 font-medium w-36"></th>
                  </tr>
                </thead>
                <tbody>
                  {themes.map((theme) => (
                    <tr key={theme.name} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                      <td className="p-3 font-medium">{theme.name}</td>
                      <td className="p-3 text-center text-muted-foreground">{theme.count}</td>
                      <td className="p-3 text-xs text-muted-foreground font-mono">
                        leads_{theme.name.toLowerCase().replace(/\s+/g, '_')}.xlsx
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => exportTheme(theme.name)}
                          disabled={exporting !== null}
                        >
                          <Download className="h-3.5 w-3.5" />
                          {exporting === theme.name ? 'Baixando...' : 'Baixar'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {themes.length > 0 && (
        <div className="glass-card p-5 space-y-4">
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FolderDown className="h-4 w-4 text-muted-foreground" />
              Exportação em lote
            </h3>
            <p className="text-xs text-muted-foreground mt-1">Baixar vários leads de uma vez</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={exportAllInOne}
              disabled={exporting !== null}
            >
              <Download className="h-4 w-4" />
              {exporting === 'all' ? 'Gerando...' : 'Uma planilha com todos os leads'}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={exportAllSeparate}
              disabled={exporting !== null || themes.length < 2}
            >
              <FolderDown className="h-4 w-4" />
              {exporting === 'all-themes' ? 'Gerando...' : 'Uma planilha por tema'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function useThemes(refreshKey = 0) {
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getExportCategories()
      .then(setThemes)
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  return { themes, loading };
}
