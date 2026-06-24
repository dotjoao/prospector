import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import { API_PORT, SCREENSHOTS_DIR } from './config/paths.js';
import { initPersistence, getPersistenceMode } from './lib/persistence.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/screenshots', express.static(SCREENSHOTS_DIR));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api', routes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[API] Erro não tratado:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

async function start() {
  await initPersistence();
  const mode = getPersistenceMode();

  const modeLabel =
    mode === 'supabase-db'
      ? 'Supabase (PostgreSQL)'
      : mode === 'supabase-storage'
        ? 'Supabase (Storage)'
        : 'Arquivos JSON locais';

  app.listen(API_PORT, () => {
    console.log(`\n🎯 LeadHunter API rodando em http://localhost:${API_PORT}`);
    console.log(`📁 Screenshots: ${path.resolve(SCREENSHOTS_DIR)}`);
    console.log(`💾 Persistência: ${modeLabel}\n`);
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Porta ${API_PORT} já está em uso.`);
      console.error('   Feche o processo anterior ou execute:');
      console.error(`   npx kill-port ${API_PORT}\n`);
    } else {
      console.error('\n❌ Erro ao iniciar servidor:', err.message);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});

export default app;
