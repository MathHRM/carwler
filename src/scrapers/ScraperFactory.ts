import type { SiteScraper } from './SiteScraper.js';
import type { SiteId } from './SiteId.js';
import { logger } from '@infra/logger.js';

/**
 * Factory para criar instâncias de scrapers
 * Segue o padrão Factory Pattern
 */
export class ScraperFactory {
  private static scrapers: Map<SiteId, () => SiteScraper> = new Map();

  /**
   * Registra um scraper na factory
   */
  static register(siteId: SiteId, factoryFn: () => SiteScraper): void {
    this.scrapers.set(siteId, factoryFn);
    logger.info(`Scraper registrado: ${siteId}`);
  }

  /**
   * Cria uma instância do scraper para o site especificado
   */
  static create(siteId: SiteId): SiteScraper {
    const factoryFn = this.scrapers.get(siteId);

    if (!factoryFn) {
      const availableSites = Array.from(this.scrapers.keys()).join(', ');
      throw new Error(
        `Scraper não encontrado para o site: ${siteId}. Sites disponíveis: ${availableSites}`
      );
    }

    logger.debug(`Criando scraper para: ${siteId}`);
    return factoryFn();
  }

  /**
   * Cria scrapers para múltiplos sites
   */
  static createMany(siteIds: SiteId[]): SiteScraper[] {
    return siteIds.map((siteId) => this.create(siteId));
  }

  /**
   * Cria scrapers para todos os sites registrados
   */
  static createAll(): SiteScraper[] {
    return Array.from(this.scrapers.keys()).map((siteId) => this.create(siteId));
  }

  /**
   * Retorna o scraper apropriado baseado na URL
   */
  static createFromUrl(url: string): SiteScraper {
    for (const [siteId, factoryFn] of this.scrapers.entries()) {
      const scraper = factoryFn();
      if (scraper.canHandle(url)) {
        logger.debug(`Scraper identificado pela URL: ${siteId}`);
        return scraper;
      }
    }

    const availableSites = Array.from(this.scrapers.keys()).join(', ');
    throw new Error(
      `Nenhum scraper pode processar a URL: ${url}. Sites disponíveis: ${availableSites}`
    );
  }

  /**
   * Lista todos os sites registrados
   */
  static getAvailableSites(): SiteId[] {
    return Array.from(this.scrapers.keys());
  }

  /**
   * Verifica se um site está registrado
   */
  static hasScraper(siteId: SiteId): boolean {
    return this.scrapers.has(siteId);
  }
}

