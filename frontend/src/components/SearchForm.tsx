import { useState } from 'react';
import { Search, Loader2, MapPin, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ESTADOS_BR } from '@/services/api';
import { SearchParams } from '@/types';

interface SearchFormProps {
  onSearch: (params: SearchParams) => Promise<void>;
  defaultCity?: string;
  defaultState?: string;
}

export function SearchForm({ onSearch, defaultCity = 'Cuiabá', defaultState = 'MT' }: SearchFormProps) {
  const [cidade, setCidade] = useState(defaultCity);
  const [estado, setEstado] = useState(defaultState);
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoria.trim()) return;

    setLoading(true);
    try {
      await onSearch({ cidade, estado, categoria });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-white/[0.06] px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2.5">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Nova busca</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Encontre empresas no Google, analise sites e gere score com estratégia de abordagem.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="categoria" className="flex items-center gap-1.5 text-xs font-medium">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              Nicho / Categoria
            </Label>
            <Input
              id="categoria"
              placeholder="Ex: Dentista, Psicólogo..."
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade" className="flex items-center gap-1.5 text-xs font-medium">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              Cidade
            </Label>
            <Input
              id="cidade"
              placeholder="Ex: Cuiabá"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="bg-background/50"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado" className="text-xs font-medium">Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger id="estado" className="bg-background/50">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_BR.map((uf) => (
                  <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full h-10 gap-2 shadow-lg shadow-primary/20" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Buscar leads
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Confira se a UF corresponde à cidade (ex.: Cuiabá = MT).
        </p>
      </form>
    </div>
  );
}
