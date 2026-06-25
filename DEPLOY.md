# Deploy LeadHunter (3 passos)

## Passo 0 — Enviar código pro GitHub

Se ainda não fez push das últimas alterações:

```powershell
git add .
git commit -m "Preparar deploy Render + Vercel"
git push
```

## O que você precisa ter

- Conta no [GitHub](https://github.com) (repositório já conectado)
- Conta no [Render](https://render.com) (backend grátis)
- Conta na [Vercel](https://vercel.com) (frontend grátis)
- Variáveis do `backend/.env` (Supabase)

**Login do app:** `admin` / `leadhunter123`

---

## Passo 1 — Backend no Render (~5 min)

1. Acesse [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. **New Blueprint Instance** → conecte o repositório `prospector`
3. O Render detecta o `render.yaml` automaticamente
4. Preencha as variáveis secretas (copie do seu `backend/.env`):

| Variável | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://hgpofqgcwmabcyiwkfvq.supabase.co` |
| `SUPABASE_SECRET_KEY` | sua secret key |
| `SUPABASE_DB_PASSWORD` | sua senha do banco |
| `FRONTEND_URL` | deixe vazio por enquanto |

5. Clique **Apply** e aguarde o deploy
6. Copie a URL pública gerada, ex: `https://leadhunter-api.onrender.com`

Teste no navegador: `https://SUA-URL.onrender.com/api/health` → deve retornar `{"status":"ok",...}`

---

## Passo 2 — Frontend na Vercel (~3 min)

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório `prospector`
3. **Não altere** Build/Output — o `vercel.json` na raiz já configura tudo
4. Adicione **1 variável de ambiente**:

| Variável | Valor |
|----------|-------|
| `VITE_API_URL` | URL do Render do passo 1 (sem barra no final) |

5. Clique **Deploy**
6. Copie a URL da Vercel, ex: `https://prospector.vercel.app`

---

## Passo 3 — CORS (opcional, recomendado)

No Render, edite o serviço `leadhunter-api` e adicione:

```
FRONTEND_URL=https://SUA-URL.vercel.app
```

Salve — o serviço reinicia automaticamente.

---

## Usar no celular

1. Abra a URL da Vercel no Chrome ou Safari
2. Faça login com `admin` / `leadhunter123`
3. Toque em **Adicionar à tela inicial** (Android) ou **Compartilhar → Tela de Início** (iPhone)

---

## Validar antes de subir

No seu PC, rode:

```powershell
npm run deploy:check
```

---

## Problemas comuns

| Problema | Solução |
|----------|---------|
| Tela branca após login | `VITE_API_URL` incorreto na Vercel — redeploy após corrigir |
| Erro de CORS | Adicione `FRONTEND_URL` no Render com a URL exata da Vercel |
| API lenta no 1º acesso | Render free tier “dorme” após 15 min — aguarde ~30s |
| Login falha | Rode `cd backend && npx tsx scripts/apply-auth-migration.ts` |
