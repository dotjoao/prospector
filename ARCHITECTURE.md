# LeadHunter - Arquitetura do Projeto

## Visão Geral

Monorepo com frontend React e backend Express, persistência exclusiva em arquivos JSON.

```
prospector/
├── frontend/                 # React + Vite + Tailwind + Shadcn/UI
│   └── src/
│       ├── components/       # Componentes de UI e negócio
│       ├── services/         # Cliente API
│       ├── types/            # Interfaces TypeScript
│       └── lib/              # Utilitários
├── backend/                  # Express + TypeScript
│   └── src/
│       ├── config/           # Paths e constantes
│       ├── routes/           # Endpoints REST
│       ├── services/         # Lógica de negócio
│       ├── types/            # Interfaces TypeScript
│       └── utils/            # Score, storage, mensagens
├── data/
│   ├── leads.json            # Persistência de leads (CRM)
│   └── config.json           # Configurações da aplicação
├── exports/                  # Arquivos Excel gerados
└── screenshots/              # Screenshots dos sites
```

## Fluxo Principal - Encontrar Oportunidades

1. **Frontend** envia POST `/api/opportunities/find` com cidade, estado, categoria
2. **GooglePlacesService** busca empresas via Text Search + Place Details
3. **WebsiteAnalyzerService** analisa cada site (online, HTTPS, responsivo, WhatsApp, formulário)
4. **ScreenshotService** captura screenshot com Playwright (sites online)
5. **Score** calculado com base nas regras de pontuação
6. **LeadsService** persiste em `data/leads.json`
7. Retorna top 20 prospects ordenados por score

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/dashboard` | Estatísticas do dashboard |
| GET | `/api/leads` | Listar leads com filtros |
| GET | `/api/leads/:id` | Detalhe de um lead |
| PUT | `/api/leads/:id` | Atualizar CRM do lead |
| DELETE | `/api/leads/:id` | Remover lead |
| POST | `/api/opportunities/find` | Buscar e analisar oportunidades |
| GET | `/api/leads/:id/message` | Gerar mensagem de prospecção |
| POST | `/api/export/excel` | Exportar para Excel |
| GET | `/api/export/download` | Download do Excel |
| GET/PUT | `/api/config` | Configurações |

## Score de Oportunidade

| Critério | Pontos |
|----------|--------|
| Sem site | +40 |
| Site fora do ar | +30 |
| Sem WhatsApp | +20 |
| Sem formulário | +10 |
| Sem responsividade | +15 |
| >50 avaliações | +20 |
| >100 avaliações | +30 |
| Nota >4.5 | +10 |

**Prioridade:** 0-30 Baixa | 31-60 Média | 61-100 Alta | 101+ Muito Alta

## Migração Futura para PostgreSQL

A arquitetura em camadas facilita migração:
- `LeadsService` → Repository pattern com adapter JSON/PostgreSQL
- Interfaces `Lead`, `AppConfig` permanecem iguais
- Rotas e frontend não precisam mudar
