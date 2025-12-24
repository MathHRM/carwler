import type { Page } from 'playwright';
import type { SiteScraper } from './SiteScraper.js';
import type { ScrapingOptions } from './types.js';
import type { SiteId } from './SiteId.js';
import type { SearchArgs } from './SearchArgs.js';
import { SITE_URLS } from './SiteId.js';
import { logger } from '@infra/logger.js';
import { config } from '@config/index.js';

/**
 * Classe base abstrata para scrapers
 * Fornece funcionalidades comuns como retry, logging, etc.
 */
export abstract class BaseScraper implements SiteScraper {
  protected readonly siteId: SiteId;

  constructor(siteId: SiteId) {
    this.siteId = siteId;
  }

  /**
   * Retorna o identificador do site
   */
  getSiteId(): SiteId {
    return this.siteId;
  }

  /**
   * Implementação abstrata - deve ser implementada por subclasses
   */
  abstract scrapeList(
    page: Page,
    searchArgs: SearchArgs,
    options?: ScrapingOptions
  ): Promise<import('./types.js').ScrapingResult<import('@domain/CarAd.js').CarAd[]>>;

  abstract scrapeDetail(
    page: Page,
    url: string,
    options?: ScrapingOptions
  ): Promise<import('./types.js').ScrapingResult<import('@domain/CarAd.js').CarAd>>;

  abstract canHandle(url: string): boolean;

  /**
   * Executa uma função com retry automático
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = config.crawler.maxRetries,
    delay: number = config.crawler.retryDelay
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Tentativa ${attempt}/${maxRetries} falhou para ${this.siteId}`, {
          error: lastError.message,
          attempt,
        });

        if (attempt < maxRetries) {
          await this.sleep(delay * attempt); // Backoff exponencial
        }
      }
    }

    throw lastError || new Error('Erro desconhecido após retries');
  }

  /**
   * Aguarda um tempo determinado
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Aguarda um tempo aleatório entre min e max (útil para evitar detecção)
   */
  protected randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.sleep(delay);
  }

  /**
   * Navega para uma URL com tratamento de erros
   */
  protected async navigateToPage(page: Page, url: string, options?: ScrapingOptions): Promise<void> {
    try {
      logger.info(`Navegando para: ${url}`, { site: this.siteId });
      await page.goto(url, {
        waitUntil: 'networkidle',
        timeout: options?.timeout || config.playwright.timeout,
      });

      // Aguardar um pouco para garantir que a página carregou completamente
      if (options?.delay) {
        await this.sleep(options.delay);
      }
    } catch (error) {
      logger.error(`Erro ao navegar para ${url}`, { error, site: this.siteId });
      throw error;
    }
  }

  /**
   * Extrai texto de um elemento de forma segura
   */
  protected async safeGetText(page: Page, selector: string): Promise<string | null> {
    try {
      const element = await page.locator(selector).first();
      if ((await element.count()) === 0) {
        return null;
      }
      const text = await element.textContent();
      return text?.trim() || null;
    } catch (error) {
      logger.debug(`Erro ao extrair texto do seletor: ${selector}`, { error, site: this.siteId });
      return null;
    }
  }

  /**
   * Extrai atributo de um elemento de forma segura
   */
  protected async safeGetAttribute(
    page: Page,
    selector: string,
    attribute: string
  ): Promise<string | null> {
    try {
      const element = await page.locator(selector).first();
      if ((await element.count()) === 0) {
        return null;
      }
      return (await element.getAttribute(attribute)) || null;
    } catch (error) {
      logger.debug(`Erro ao extrair atributo ${attribute} do seletor: ${selector}`, {
        error,
        site: this.siteId,
      });
      return null;
    }
  }

  /**
   * Retorna a URL base do site
   */
  protected getBaseUrl(): string {
    return SITE_URLS[this.siteId];
  }

  /**
   * Constrói URL de busca baseada nos argumentos
   * Cada scraper deve implementar sua própria lógica de construção de URL
   * Este método deve ser sobrescrito pelas subclasses
   */
  protected buildSearchUrl(_searchArgs: SearchArgs): string {
    // Implementação padrão - subclasses devem sobrescrever
    // O prefixo _ indica que o parâmetro é intencionalmente não usado aqui
    return this.getBaseUrl();
  }
}

