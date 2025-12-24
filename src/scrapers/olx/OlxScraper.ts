import type { Page } from 'playwright';
import type { ScrapingResult, ScrapingOptions } from '../types.js';
import type { SearchArgs } from '../SearchArgs.js';
import type { CarAd } from '@domain/CarAd.js';
import { BaseScraper } from '../BaseScraper.js';
import { SiteId, SITE_URLS } from '../SiteId.js';
import { OlxListPage } from './OlxListPage.js';
import { OlxAdapter } from './OlxAdapter.js';
import { logger } from '@infra/logger.js';

/**
 * Scraper para o site OLX
 * Implementa SiteScraper usando Strategy Pattern
 */
export class OlxScraper extends BaseScraper {
  private readonly listPage: OlxListPage;
  private readonly adapter: OlxAdapter;

  constructor() {
    super(SiteId.OLX);
    this.listPage = new OlxListPage();
    this.adapter = new OlxAdapter();
  }

  /**
   * Constrói URL de busca baseada nos argumentos
   * Por padrão, busca em MG (Minas Gerais), mas pode ser estendido para outros estados
   */
  protected buildSearchUrl(searchArgs: SearchArgs, state: string = 'mg'): string {
    const baseUrl = `${SITE_URLS[SiteId.OLX]}/autos-e-pecas/carros-vans-e-utilitarios/estado-${state.toLowerCase()}`;
    const params = new URLSearchParams();

    // Modelo (obrigatório)
    params.append('q', searchArgs.modelo);

    // Preço máximo (pe)
    if (searchArgs.maxPrice) {
      params.append('pe', searchArgs.maxPrice.toString());
    }

    // Quilometragem máxima (me) - OLX usa km máximo
    // Nota: SearchArgs não tem maxMileage, então não aplicamos filtro de km
    // Se necessário no futuro, pode ser adicionado

    // Ano máximo (re)
    if (searchArgs.maxYear) {
      params.append('re', searchArgs.maxYear.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Faz scraping de uma página de listagem
   */
  async scrapeList(
    page: Page,
    searchArgs: SearchArgs,
    options?: ScrapingOptions
  ): Promise<ScrapingResult<CarAd[]>> {
    const startTime = Date.now();

    try {
      // Construir URL de busca
      const searchUrl = this.buildSearchUrl(searchArgs);
      logger.info(`Fazendo scraping da OLX: ${searchUrl}`, { searchArgs });

      // Navegar para a página
      await this.navigateToPage(page, searchUrl, options);

      // Extrair anúncios
      const rawAds = await this.listPage.extractAds(page);
      logger.info(`${rawAds.length} anúncios brutos extraídos`);

      // Adaptar para CarAd
      const ads: CarAd[] = rawAds
        .map((rawAd) => this.adapter.adapt(rawAd, rawAd.url))
        .filter((ad) => ad.id && ad.title && ad.url);

      // Filtrar por preço máximo se especificado (já que a URL pode não filtrar corretamente)
      // maxPrice vem em reais, mas CarAd.price está em centavos
      const filteredAds =
        searchArgs.maxPrice !== undefined
          ? ads.filter((ad) => ad.price <= searchArgs.maxPrice! * 100)
          : ads;

      // Filtrar por ano máximo se especificado
      const finalAds =
        searchArgs.maxYear !== undefined
          ? filteredAds.filter((ad) => !ad.year || ad.year <= searchArgs.maxYear!)
          : filteredAds;

      const duration = Date.now() - startTime;

      logger.info(`${finalAds.length} anúncios normalizados após filtros`);

      return {
        success: true,
        data: finalAds,
        metadata: {
          url: searchUrl,
          timestamp: new Date(),
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erro ao fazer scraping da listagem OLX', { error, searchArgs });

      return {
        success: false,
        data: null,
        error: errorMessage,
        metadata: {
          timestamp: new Date(),
          duration,
        },
      };
    }
  }

  /**
   * Faz scraping de uma página de detalhe de anúncio
   * Por enquanto, retorna erro pois não é necessário para o caso de uso atual
   */
  async scrapeDetail(
    _page: Page,
    url: string,
    _options?: ScrapingOptions
  ): Promise<ScrapingResult<CarAd>> {
    logger.warn('scrapeDetail não implementado para OLX', { url });
    return {
      success: false,
      data: null,
      error: 'scrapeDetail não implementado para OLX',
      metadata: {
        url,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Verifica se uma URL pertence à OLX
   */
  canHandle(url: string): boolean {
    return url.includes('olx.com.br') || url.includes('olx.com');
  }
}

