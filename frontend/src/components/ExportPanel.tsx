import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api } from '@/services/api';

interface ExportPanelProps {
  onNotify: (type: 'success' | 'error', message: string) => void;
  refreshKey?: number;
}

interface CategoryOption {
  name: string;
  count: number;
}

function downloadFile(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function ExportPanel({ onNotify, refreshKey = 0 }: ExportPanelProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [refreshKey]);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await api.getExportCategories();
      setCategories(data);
      if (data.length > 0 && !selectedTheme) {
        setSelectedTheme(data[0].name);
      }
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExportTheme(categoria?: string) {
    const key = categoria || 'all';
    setExporting(key);
    try {
      const result = await api.exportExcel(categoria);
      downloadFile(result.downloadUrl, result.fileName);
      const label = categoria ? `"${categoria}"` : 'todos os leads';
      onNotify('success', `${result.count} leads exportados (${label}) → ${result.fileName}`);
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportAllThemes() {
    setExporting('all-themes');
    try {
      const result = await api.exportAllThemes();
      for (const item of result.exports) {
        downloadFile(item.downloadUrl, item.fileName);
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      onNotify(
        'success',
        `${result.totalThemes} planilhas geradas (uma por tema) na pasta exports/`
      );
    } catch (err) {
      onNotify('error', (err as Error).message);
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner text="Carregando temas..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Exportar Planilhas por Tema
        </CardTitle>
        <CardDescription>
          Gere arquivos Excel separados por categoria: Psicólogo, Personal Trainer, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum tema disponível. Busque oportunidades para criar planilhas por categoria.
          </p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Selecionar tema</label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um tema" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.name} ({cat.count} leads)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => handleExportTheme(selectedTheme)}
                  disabled={!selectedTheme || exporting !== null}
                >
                  <Download className="h-4 w-4" />
                  {exporting === selectedTheme ? 'Exportando...' : 'Exportar tema'}
                </Button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.count} leads</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportTheme(cat.name)}
                    disabled={exporting !== null}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => handleExportTheme()}
            disabled={exporting !== null || categories.length === 0}
            className="flex-1"
          >
            <Download className="h-4 w-4" />
            {exporting === 'all' ? 'Exportando...' : 'Exportar todos os leads'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportAllThemes}
            disabled={exporting !== null || categories.length === 0}
            className="flex-1"
          >
            <Layers className="h-4 w-4" />
            {exporting === 'all-themes' ? 'Gerando...' : 'Gerar planilha de cada tema'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
