import { chromium } from 'playwright';
import path from 'path';
import { SCREENSHOTS_DIR } from '../config/paths.js';
import { ensureDir, sanitizeFilename } from '../utils/storage.js';

export class ScreenshotService {
  async capture(empresa: string, website: string): Promise<string | undefined> {
    if (!website || website.trim() === '') {
      return undefined;
    }

    let url = website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    await ensureDir(SCREENSHOTS_DIR);
    const filename = `${sanitizeFilename(empresa)}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    console.log(`[Screenshot] Capturando: ${url} -> ${filename}`);

    let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1280, height: 720 });

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      await page.waitForTimeout(2000);
      await page.screenshot({ path: filepath, fullPage: false });

      console.log(`[Screenshot] Salvo: ${filepath}`);
      return `/screenshots/${filename}`;
    } catch (error) {
      console.warn(`[Screenshot] Falha ao capturar ${url}:`, error);
      return undefined;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}

export const screenshotService = new ScreenshotService();
