# Integração Supabase — LeadHunter

## O que você precisa me fornecer

Crie um projeto em [supabase.com](https://supabase.com) e configure o arquivo `backend/.env`:

| Variável | Onde encontrar | Obrigatório |
|----------|----------------|-------------|
| `SUPABASE_URL` | Dashboard → **Settings** → **API** → **Project URL** | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → **Settings** → **API** → **service_role** (secret) | Sim |

> **Não compartilhe a `service_role` key publicamente.** Ela bypassa RLS e deve ficar só no backend.

### Opcional (já no config ou .env)

| Dado | Onde usar hoje |
|------|----------------|
| Google Places API Key | `app_settings` no Supabase ou `data/config.json` |
| Cidade/Estado padrão | `app_settings.default_city` / `default_state` |

---

## Passo a passo

### 1. Criar projeto no Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard)
2. **New Project** → escolha nome, senha do banco e região (ex: South America)

### 2. Executar a migration SQL

1. No dashboard: **SQL Editor** → **New query**
2. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Clique **Run**

Isso cria:

| Tabela | Descrição |
|--------|-----------|
| `leads` | Todos os leads + CRM + análise de site (JSON) |
| `app_settings` | Configurações da aplicação (1 linha) |

### 3. Configurar `.env` no backend

```bash
cd backend
copy .env.example .env
```

Preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

### 4. Migrar dados existentes (opcional)

Se você já tem leads em `data/leads.json`:

```bash
cd backend
npm run migrate:supabase
```

### 5. Iniciar a aplicação

```bash
npm run dev
```

---

## Estrutura das tabelas

### `leads`

- Dados da empresa (nome, categoria, endereço, telefone, site)
- Score, prioridade, status CRM
- Mensagem de prospecção editável
- `website_analysis` (JSON): status do site, HTTPS, WhatsApp, etc.
- Unique em `google_maps_url` (evita duplicatas)

### `app_settings`

- `google_places_api_key`
- `default_city`, `default_state`
- `max_results`, `top_prospects`
- `enable_screenshots`

---

## O que NÃO vai para o Supabase (por enquanto)

| Item | Motivo |
|------|--------|
| Arquivos Excel (`exports/`) | Gerados sob demanda |
| Screenshots (`screenshots/`) | Arquivos locais (futuro: Supabase Storage) |

---

## Segurança

- Backend usa **service_role** → acesso total server-side
- Frontend continua falando com a API Express (não acessa Supabase diretamente)
- RLS habilitado: anon/authenticated sem políticas = bloqueados
