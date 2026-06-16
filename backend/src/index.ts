import express from 'express';
import cors from 'cors';
import path from 'path';
import routes from './routes/index.js';
import { API_PORT, SCREENSHOTS_DIR } from './config/paths.js';

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

app.listen(API_PORT, () => {
  console.log(`\n🎯 LeadHunter API rodando em http://localhost:${API_PORT}`);
  console.log(`📁 Screenshots: ${path.resolve(SCREENSHOTS_DIR)}\n`);
});

export default app;
