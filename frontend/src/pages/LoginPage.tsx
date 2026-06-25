import { useState } from 'react';
import {
  Target,
  User,
  Lock,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await signIn(username.trim(), password);
      if (err) setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/20 via-background to-background border-r">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/20 p-3">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">LeadHunter</h1>
            <p className="text-sm text-muted-foreground">Prospecção Inteligente</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold leading-tight">
            Encontre leads qualificados e feche mais negócios.
          </h2>
          <p className="text-muted-foreground text-lg">
            Busque empresas no Google, analise sites, gere score e mensagens de WhatsApp prontas.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} LeadHunter
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md border-border/60 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 lg:hidden mb-2">
              <Target className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">LeadHunter</span>
            </div>
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription>
              Acesse o LeadHunter para prospectar e gerenciar seus leads.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    className="pl-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/30">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
