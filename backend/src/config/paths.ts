import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ROOT_DIR = path.resolve(__dirname, '../../..');
export const DATA_DIR = path.join(ROOT_DIR, 'data');
export const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');
export const SCREENSHOTS_DIR = path.join(ROOT_DIR, 'screenshots');

export const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
export const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
export const EXPORT_FILE = path.join(EXPORTS_DIR, 'leads.xlsx');

export const API_PORT = 3333;
