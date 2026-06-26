import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import { API_PORT, SCREENSHOTS_DIR } from './config/paths.js';
import { initPersistence, getPersistenceMode } from './lib/persistence.js';

const app = express();

function getAllowedOrigins(): string[] | null {
  const raw = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
  if (!raw) return null;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || !allowedOrigins) {
        callback(null, true);
        return;
      }
      callback(null, allowedOrigins.includes(origin));
    },
  })
);
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'LeadHunter API' });
});

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

function logPersistenceMode(mode: ReturnType<typeof getPersistenceMode>) {
  const modeLabel =
    mode === 'supabase-db'
      ? 'Supabase (PostgreSQL)'
      : mode === 'supabase-storage'
        ? 'Supabase (Storage)'
        : 'Arquivos JSON locais';
  console.log(`💾 Persistência: ${modeLabel}`);
}

async function start() {
  app.listen(API_PORT, '0.0.0.0', () => {
    console.log(`\n🎯 LeadHunter API rodando na porta ${API_PORT}`);
    console.log(`📁 Screenshots: ${path.resolve(SCREENSHOTS_DIR)}`);
    if (allowedOrigins?.length) {
      console.log(`🌐 CORS: ${allowedOrigins.join(', ')}`);
    }
    console.log('⏳ Inicializando persistência em background...\n');
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

  try {
    await initPersistence();
    logPersistenceMode(getPersistenceMode());
  } catch (err) {
    console.error('[Persistência] Falha na inicialização:', (err as Error).message);
  }
}

start().catch((err) => {
  console.error('Falha ao iniciar:', err);
  process.exit(1);
});

export default app;
