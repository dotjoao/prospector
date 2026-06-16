# LeadHunter

Ferramenta para encontrar potenciais clientes para venda de Landing Pages, Sites Institucionais e serviços de otimização do Google Meu Negócio.

## Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS + Shadcn/UI
- **Backend:** Node.js + Express + TypeScript
- **Persistência:** Arquivos JSON locais (sem banco de dados)

## Estrutura

```
leadhunter/
├── frontend/       # Interface React
├── backend/        # API Express
├── data/           # leads.json, config.json
├── exports/        # Arquivos Excel exportados
└── screenshots/    # Screenshots dos sites analisados
```

## Configuração

1. Instale as dependências:

```bash
npm run install:all
```

2. Configure a API Key do Google Places em `data/config.json`:

```json
{
  "googlePlacesApiKey": "SUA_API_KEY_AQUI"
}
```

3. Instale os browsers do Playwright (para screenshots):

```bash
cd backend && npx playwright install chromium
```

## Execução

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Funcionalidades

- Busca de empresas via Google Places API
- Análise automática de websites (online, HTTPS, responsividade, WhatsApp, formulário)
- Screenshots automáticos com Playwright
- Score de oportunidade com priorização
- Dashboard com métricas
- CRM simples com status e follow-up
- Exportação para Excel
- Filtros avançados
- Gerador de mensagens de prospecção
