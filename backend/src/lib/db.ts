import pg from 'pg';

let pool: pg.Pool | null = null;

export function isDbDirectAvailable(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_DB_PASSWORD);
}

export function getDbPool(): pg.Pool {
  if (!pool) {
    const ref = process.env.SUPABASE_URL?.match(/https:\/\/([^.]+)/)?.[1];
    const password = process.env.SUPABASE_DB_PASSWORD;
    if (!ref || !password) {
      throw new Error('SUPABASE_URL e SUPABASE_DB_PASSWORD são necessários para autenticação no banco.');
    }

    pool = new pg.Pool({
      host: process.env.SUPABASE_DB_HOST || 'aws-1-us-west-2.pooler.supabase.com',
      port: Number(process.env.SUPABASE_DB_PORT || 5432),
      user: `postgres.${ref}`,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }

  return pool;
}
