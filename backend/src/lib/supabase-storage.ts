import { getSupabaseServiceKey } from './supabase.js';

export const STORAGE_BUCKET = 'leadhunter-data';
export const STORAGE_LEADS_PATH = 'leads.json';
export const STORAGE_CONFIG_PATH = 'config.json';

function storageHeaders(): Record<string, string> {
  const key = getSupabaseServiceKey()!;
  return { apikey: key, Authorization: `Bearer ${key}` };
}

function objectUrl(path: string): string {
  return `${process.env.SUPABASE_URL!}/storage/v1/object/${STORAGE_BUCKET}/${path}`;
}

export async function ensureStorageBucket(): Promise<void> {
  const url = `${process.env.SUPABASE_URL!}/storage/v1/bucket`;
  const list = await fetch(url, { headers: storageHeaders() });
  if (!list.ok) throw new Error(`[Supabase Storage] Erro ao listar buckets: ${list.status}`);

  const buckets = (await list.json()) as { name: string }[];
  if (buckets.some((b) => b.name === STORAGE_BUCKET)) return;

  const create = await fetch(url, {
    method: 'POST',
    headers: { ...storageHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: STORAGE_BUCKET, name: STORAGE_BUCKET, public: false }),
  });

  if (!create.ok) {
    const body = await create.text();
    throw new Error(`[Supabase Storage] Erro ao criar bucket: ${create.status} ${body}`);
  }

  console.log('[Supabase Storage] Bucket criado:', STORAGE_BUCKET);
}

export async function readStorageJson<T>(path: string, defaultValue: T): Promise<T> {
  const res = await fetch(objectUrl(path), { headers: storageHeaders() });
  if (res.status === 404) return defaultValue;

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 400 && body.includes('not_found')) return defaultValue;
    throw new Error(`[Supabase Storage] Erro ao ler ${path}: ${res.status} ${body}`);
  }

  const text = await res.text();
  if (!text.trim()) return defaultValue;
  return JSON.parse(text.replace(/^\uFEFF/, '')) as T;
}

export async function writeStorageJson<T>(path: string, data: T): Promise<void> {
  const res = await fetch(objectUrl(path), {
    method: 'POST',
    headers: {
      ...storageHeaders(),
      'Content-Type': 'application/json',
      'x-upsert': 'true',
    },
    body: JSON.stringify(data, null, 2),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[Supabase Storage] Erro ao salvar ${path}: ${res.status} ${body}`);
  }
}
