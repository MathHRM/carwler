import type { Page } from 'playwright';
import type { CrawlOptions, CrawlResult } from './types.js';
import type { CarAd } from '@domain/CarAd.js';
import type { SiteId } from '@scrapers/SiteId.js';
import { ScraperFactory } from '@scrapers/ScraperFactory.js';
import { getAllSiteIds } from '@scrapers/SiteId.js';
import { logger } from '@infra/logger.js';
import { createPlaywrightInstance, closePlaywrightInstance } from '@config/playwright.js';

// Importar scrapers para garantir registro na factory
import '@scrapers/index.js';

/**
 * Serviço de orquestração para crawling
 * Coordena o processo de scraping usando a factory e retorna dados normalizados
 */
export class CrawlService {
  /**
   * Executa crawling de múltiplos sites com os argumentos de busca fornecidos
   */
  async crawl(page: Page, options: CrawlOptions): Promise<CrawlResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const ads: CarAd[] = [];
    const sitesProcessed: SiteId[] = [];

    try {
      // Determinar quais sites processar
      const sitesToProcess = options.sites || getAllSiteIds();
      logger.info(`Iniciando crawling para ${sitesToProcess.length} site(s)`, {
        sites: sitesToProcess,
        searchArgs: options.searchArgs,
      });

      // Processar cada site
      for (const siteId of sitesToProcess) {
        try {
          const scraper = ScraperFactory.create(siteId);
          logger.info(`Processando site: ${siteId}`, { searchArgs: options.searchArgs });

          // Fazer scraping de listagem
          const result = await scraper.scrapeList(page, options.searchArgs, {
            maxPages: options.allPages ? undefined : 1,
            timeout: options.timeout,
            delay: options.delay,
          });

          if (result.success && result.data) {
            // Normalizar result.data para sempre ser um array de CarAd
            const resultAds = Array.isArray(result.data)
                ? result.data as CarAd[]
                : [result.data as CarAd];
            ads.push(...resultAds);
            sitesProcessed.push(siteId);
            logger.info(`Site ${siteId} processado: ${resultAds.length} anúncios encontrados`);
          } else {
            const errorMsg = result.error || 'Erro desconhecido ao fazer scraping de listagem';
            errors.push(`${siteId}: ${errorMsg}`);
            logger.warn(`Erro ao processar site ${siteId}`, { error: errorMsg });
          }

          // Aguardar um pouco entre sites para evitar sobrecarga
          if (sitesToProcess.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`${siteId}: ${errorMessage}`);
          logger.error(`Erro ao processar site ${siteId}`, { error });
        }
      }

      const duration = Date.now() - startTime;

      return {
        success: errors.length === 0,
        ads,
        total: ads.length,
        errors,
        metadata: {
          sites: sitesProcessed,
          duration,
          timestamp: new Date(),
          searchArgs: options.searchArgs,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      logger.error('Erro durante crawling', { error, options });

      return {
        success: false,
        ads,
        total: ads.length,
        errors,
        metadata: {
          sites: sitesProcessed,
          duration,
          timestamp: new Date(),
          searchArgs: options.searchArgs,
        },
      };
    }
  }

  /**
   * Executa crawling completo (cria sua própria instância do Playwright)
   */
  async crawlWithBrowser(options: CrawlOptions): Promise<CrawlResult> {
    let browser = null;
    let context = null;
    let page = null;

    try {
      const { browser: b, context: c, page: p } = await createPlaywrightInstance();
      browser = b;
      context = c;
      page = p;

      return await this.crawl(page, options);
    } finally {
      await closePlaywrightInstance(browser, context, page);
    }
  }
}

