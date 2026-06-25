import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FolderDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <Card>
        <CardContent className="py-12">
          <LoadingSpinner text="Carregando temas..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 text-sm">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-300">Dados no Supabase · Planilhas para download</p>
          <p className="text-muted-foreground mt-1">
            Seus leads ficam salvos no banco de dados. As planilhas Excel são exportações locais
            para prospecção offline — cada tema gera um arquivo separado.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Planilhas por tema
          </CardTitle>
          <CardDescription>
            Cada busca que você faz cria um tema. Baixe a planilha do tema que quiser trabalhar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum tema ainda. Vá em <strong>Prospectar</strong> e busque oportunidades
              (ex: Psicólogo, Personal Trainer).
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Tema</th>
                    <th className="text-center p-3 font-medium w-24">Leads</th>
                    <th className="text-left p-3 font-medium w-40">Arquivo</th>
                    <th className="text-right p-3 font-medium w-36"></th>
                  </tr>
                </thead>
                <tbody>
                  {themes.map((theme) => (
                    <tr key={theme.name} className="border-b last:border-0 hover:bg-muted/30">
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
        </CardContent>
      </Card>

      {themes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderDown className="h-5 w-5 text-muted-foreground" />
              Exportação em lote
            </CardTitle>
            <CardDescription>Opções para baixar vários leads de uma vez</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
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
          </CardContent>
        </Card>
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
