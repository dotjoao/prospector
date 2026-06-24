import 'dotenv/config';
import { applyDatabaseSchema } from '../src/lib/apply-schema.js';

const ok = await applyDatabaseSchema();
process.exit(ok ? 0 : 1);
