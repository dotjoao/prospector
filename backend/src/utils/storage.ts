import fs from 'fs/promises';
import { existsSync } from 'fs';

export async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    if (!existsSync(filePath)) {
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    let content = await fs.readFile(filePath, 'utf-8');
    content = content.replace(/^\uFEFF/, '');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`[Storage] Erro ao ler ${filePath}:`, error);
    throw new Error(`Falha ao ler arquivo: ${filePath}`);
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  try {
    const content = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`[Storage] Arquivo salvo: ${filePath}`);
  } catch (error) {
    console.error(`[Storage] Erro ao salvar ${filePath}:`, error);
    throw new Error(`Falha ao salvar arquivo: ${filePath}`);
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`[Storage] Diretório criado: ${dirPath}`);
  }
}

export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 50);
}
