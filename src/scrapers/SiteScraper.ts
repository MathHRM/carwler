import type { CarAd } from '@domain/CarAd.js';
import type { Page } from 'playwright';
import type { ScrapingResult, ScrapingOptions } from './types.js';
import type { SiteId } from './SiteId.js';
import type { SearchArgs } from './SearchArgs.js';

/**
 * Interface comum que todos os scrapers devem implementar
 * Segue o padrão Strategy
 */
export interface SiteScraper {
    /**
     * Retorna o identificador único do site (enum SiteId)
     */
    getSiteId(): SiteId;

    /**
     * Faz scraping de uma página de listagem
     * Retorna array de CarAd normalizados
     * @param page Página do Playwright
     * @param searchArgs Argumentos de busca (modelo, maxYear, maxPrice)
     * @param options Opções adicionais de scraping
     */
    scrapeList(
        page: Page,
        searchArgs: SearchArgs,
        options?: ScrapingOptions
    ): Promise<ScrapingResult<CarAd[]>>;

    /**
     * Faz scraping de uma página de detalhe de anúncio
     * Retorna um único CarAd normalizado
     */
    scrapeDetail(
        page: Page,
        url: string,
        options?: ScrapingOptions
    ): Promise<ScrapingResult<CarAd>>;

    /**
     * Verifica se uma URL pertence a este site
     */
    canHandle(url: string): boolean;
}

