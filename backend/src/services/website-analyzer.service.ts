import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebsiteAnalysis, SiteStatus } from '../types/index.js';
import { isInstagramUrl, isWhatsAppUrl, isSocialOnlyUrl } from '../lib/lead-presence.js';

const TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_HTML_CHARS = 200_000;
const MAX_BODY_TEXT_CHARS = 50_000;

export class WebsiteAnalyzerService {
  async analyze(website: string): Promise<WebsiteAnalysis> {
    if (!website || website.trim() === '') {
      return {
        siteStatus: 'Sem Site',
        hasHttps: false,
        isResponsive: false,
        hasWhatsapp: false,
        hasForm: false,
        analyzedAt: new Date().toISOString(),
      };
    }

    let url = website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    if (isInstagramUrl(url)) {
      console.log(`[Analyzer] ${url} - Perfil Instagram (sem site profissional)`);
      return {
        siteStatus: 'Instagram',
        hasHttps: true,
        isResponsive: false,
        hasWhatsapp: false,
        hasForm: false,
        hasInstagram: true,
        analyzedAt: new Date().toISOString(),
      };
    }

    if (isWhatsAppUrl(url)) {
      console.log(`[Analyzer] ${url} - Link WhatsApp (sem site profissional)`);
      return {
        siteStatus: 'WhatsApp',
        hasHttps: true,
        isResponsive: false,
        hasWhatsapp: true,
        hasForm: false,
        analyzedAt: new Date().toISOString(),
      };
    }

    if (isSocialOnlyUrl(url)) {
      console.log(`[Analyzer] ${url} - Rede social (sem site profissional)`);
      return {
        siteStatus: 'Social',
        hasHttps: true,
        isResponsive: false,
        hasWhatsapp: false,
        hasForm: false,
        analyzedAt: new Date().toISOString(),
      };
    }

    console.log(`[Analyzer] Analisando: ${url}`);

    try {
      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        maxRedirects: 5,
        maxContentLength: MAX_HTML_BYTES,
        maxBodyLength: MAX_HTML_BYTES,
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        validateStatus: (status) => status < 500,
      });

      if (response.status >= 400) {
        return this.offlineAnalysis(url);
      }

      const html =
        typeof response.data === 'string'
          ? response.data.slice(0, MAX_HTML_CHARS)
          : '';
      const $ = cheerio.load(html, { xml: false });
      const bodyText = $('body').text().slice(0, MAX_BODY_TEXT_CHARS);
      const searchContent = `${html}\n${bodyText}`.toLowerCase();

      const hasHttps = url.startsWith('https://') || response.request?.res?.responseUrl?.startsWith?.('https://');
      const isResponsive =
        $('meta[name="viewport"]').length > 0 ||
        html.toLowerCase().includes('name="viewport"');
      const hasWhatsapp = this.detectWhatsapp(searchContent);
      const hasForm = this.detectForm($, searchContent);

      console.log(`[Analyzer] ${url} - Online | HTTPS: ${hasHttps} | Responsive: ${isResponsive} | WhatsApp: ${hasWhatsapp} | Form: ${hasForm}`);

      return {
        siteStatus: 'Online',
        hasHttps: !!hasHttps,
        isResponsive,
        hasWhatsapp,
        hasForm,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      const isTimeout =
        axios.isAxiosError(error) &&
        (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
      const isTooLarge =
        axios.isAxiosError(error) &&
        (error.code === 'ERR_BAD_RESPONSE' ||
          error.message.includes('maxContentLength') ||
          error.message.includes('maxBodyLength'));

      if (isTooLarge) {
        console.warn(`[Analyzer] ${url} - HTML muito grande, analise limitada`);
        return {
          siteStatus: 'Online',
          hasHttps: url.startsWith('https://'),
          isResponsive: false,
          hasWhatsapp: false,
          hasForm: false,
          analyzedAt: new Date().toISOString(),
        };
      }

      console.warn(`[Analyzer] ${url} - ${isTimeout ? 'Timeout' : 'Offline'}:`, error);

      return {
        siteStatus: isTimeout ? 'Timeout' : 'Offline',
        hasHttps: url.startsWith('https://'),
        isResponsive: false,
        hasWhatsapp: false,
        hasForm: false,
        analyzedAt: new Date().toISOString(),
      };
    }
  }

  private offlineAnalysis(url: string): WebsiteAnalysis {
    return {
      siteStatus: 'Offline',
      hasHttps: url.startsWith('https://'),
      isResponsive: false,
      hasWhatsapp: false,
      hasForm: false,
      analyzedAt: new Date().toISOString(),
    };
  }

  private detectWhatsapp(content: string): boolean {
    return (
      content.includes('wa.me') ||
      content.includes('api.whatsapp') ||
      content.includes('whatsapp.com') ||
      content.includes('whatsapp:')
    );
  }

  private detectForm($: cheerio.CheerioAPI, content: string): boolean {
    const hasFormTag = $('form').length > 0;
    const hasInput = $('input[type="text"], input[type="email"], input[type="tel"]').length > 0;
    const hasTextarea = $('textarea').length > 0;
    const hasContactForm =
      content.includes('contact-form') ||
      content.includes('formulario') ||
      content.includes('contato');

    return hasFormTag || (hasInput && hasTextarea) || (hasFormTag && hasInput) || hasContactForm;
  }
}

export const websiteAnalyzerService = new WebsiteAnalyzerService();
