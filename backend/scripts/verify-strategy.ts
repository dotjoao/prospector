import 'dotenv/config';
import pg from 'pg';

const ref = process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD?.trim();

if (!ref || !password) {
  console.error('SUPABASE_URL e SUPABASE_DB_PASSWORD necessários');
  process.exit(1);
}

const client = new pg.Client({
  host: 'aws-1-us-west-2.pooler.supabase.com',
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
const { rows } = await client.query(`
  SELECT
    COUNT(*)::int AS total,
    COUNT(lead_score_final)::int AS com_score,
    COUNT(lead_strategy_type)::int AS com_strategy,
    COUNT(*) FILTER (WHERE lead_score_final >= 160)::int AS quentes,
    COUNT(*) FILTER (WHERE lead_score_final >= 120 AND lead_score_final < 160)::int AS mornos,
    COUNT(*) FILTER (WHERE lead_score_final < 120)::int AS frios
  FROM public.leads
`);
console.log('[Supabase]', rows[0]);
await client.end();
