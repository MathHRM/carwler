import type { CarAd } from '@domain/CarAd.js';
import type { ScrapingOptions } from '@scrapers/types.js';
import type { SiteId } from '@scrapers/SiteId.js';
import type { SearchArgs } from '@scrapers/SearchArgs.js';

/**
 * Opções para o serviço de crawling
 */
export interface CrawlOptions extends ScrapingOptions {
  /** Argumentos de busca (modelo, maxYear, maxPrice) */
  searchArgs: SearchArgs;
  /** Sites específicos para buscar (opcional, todos se não informado) */
  sites?: SiteId[];
  /** Se true, faz crawling de todas as páginas da listagem */
  allPages?: boolean;
}

/**
 * Resultado de uma operação de crawling
 */
export interface CrawlResult {
  success: boolean;
  ads: CarAd[];
  total: number;
  errors: string[];
  metadata: {
    sites: SiteId[];
    duration: number;
    timestamp: Date;
    searchArgs: SearchArgs;
  };
}

