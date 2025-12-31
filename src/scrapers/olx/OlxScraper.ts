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
   * Extrai URLs dos anúncios de uma página de listagem
   */
  async scrapeCarAdUrlList(
    page: Page,
    searchArgs: SearchArgs,
    options?: ScrapingOptions
  ): Promise<ScrapingResult<string[]>> {
    const startTime = Date.now();

    try {
      // Construir URL de busca
      const searchUrl = this.buildSearchUrl(searchArgs);
      logger.info(`Extraindo URLs de anúncios da OLX: ${searchUrl}`, { searchArgs });

      // Navegar para a página
      await this.navigateToPage(page, searchUrl, options);

      // Extrair cards (Locators) da página
      const adCards = await this.listPage.extractAds(page);
      logger.info(`${adCards.length} cards extraídos da página`);

      // Extrair URLs de cada card
      const urls: string[] = [];
      for (const card of adCards) {
        try {
          const titleLink = card.locator('a[data-testid="adcard-link"]').first();
          const url = (await titleLink.getAttribute('href')) || '';
          if (url) {
            // Garantir URL completa
            const fullUrl = url.startsWith('http') ? url : `https://www.olx.com.br${url}`;
            urls.push(fullUrl);
          }
        } catch (error) {
          logger.warn('Erro ao extrair URL do card', { error });
        }
      }

      const duration = Date.now() - startTime;

      logger.info(`${urls.length} URLs extraídas da página`);

      return {
        success: true,
        data: urls,
        metadata: {
          url: searchUrl,
          timestamp: new Date(),
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erro ao extrair URLs da listagem OLX', { error, searchArgs });

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
   * Faz scraping de páginas detalhadas a partir de uma lista de URLs
   */
  async scrapeDetailedList(
    page: Page,
    urls: string[],
    searchArgs: SearchArgs,
    options?: ScrapingOptions
  ): Promise<ScrapingResult<CarAd[]>> {
    const startTime = Date.now();
    const ads: CarAd[] = [];
    const errors: string[] = [];

    try {
      logger.info(`Fazendo scraping de ${urls.length} páginas detalhadas da OLX`);

      for (const url of urls) {
        try {
          // Navegar para a página detalhada
          await this.navigateToPage(page, url, options);

          // Obter Locator da página (usar body como container)
          const pageLocator = page.locator('body');

          // Adaptar página detalhada para CarAd
          this.adapter.setPayload(pageLocator, url);
          const ad = await this.adapter.adapt();

          // Aplicar filtros
          let shouldInclude = true;

          // Filtrar por preço máximo se especificado (maxPrice vem em reais, mas CarAd.price está em centavos)
          if (searchArgs.maxPrice !== undefined && ad.price > searchArgs.maxPrice * 100) {
            shouldInclude = false;
          }

          // Filtrar por ano máximo se especificado
          if (searchArgs.maxYear !== undefined && ad.year && ad.year > searchArgs.maxYear) {
            shouldInclude = false;
          }

          if (shouldInclude) {
            ads.push(ad);
          }

          // Delay entre requisições se especificado
          if (options?.delay && urls.indexOf(url) < urls.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, options.delay));
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.warn('Erro ao fazer scraping de página detalhada', { url, error: errorMessage, page: await page.content() });
          errors.push(`${url}: ${errorMessage}`);
        }
      }

      const duration = Date.now() - startTime;

      logger.info(`${ads.length} anúncios normalizados após filtros (${errors.length} erros)`);

      return {
        success: true,
        data: ads,
        metadata: {
          timestamp: new Date(),
          duration,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erro ao fazer scraping das páginas detalhadas OLX', { error, urls });

      return {
        success: false,
        data: ads.length > 0 ? ads : null,
        error: errorMessage,
        metadata: {
          timestamp: new Date(),
          duration,
        },
      };
    }
  }

  /**
   * Implementação do método abstrato scrapeList para compatibilidade
   * Agora delega para scrapeCarAdUrlList e scrapeDetailedList
   */
  async scrapeList(
    page: Page,
    searchArgs: SearchArgs,
    options?: ScrapingOptions
  ): Promise<ScrapingResult<CarAd[]>> {
    // Primeiro extrair URLs
    const urlResult = await this.scrapeCarAdUrlList(page, searchArgs, options);

    if (!urlResult.success || !urlResult.data) {
      return {
        success: false,
        data: null,
        error: urlResult.error || 'Falha ao extrair URLs',
        metadata: urlResult.metadata,
      };
    }

    // Garantir que data é um array de strings (não array de arrays)
    let urls: string[] = [];
    if (urlResult.data && Array.isArray(urlResult.data)) {
      // Verificar se é array de strings ou array de arrays
      if (urlResult.data.length > 0 && typeof urlResult.data[0] === 'string') {
        urls = urlResult.data as string[];
      }
    }

    // Depois fazer scraping detalhado
    return this.scrapeDetailedList(page, urls, searchArgs, options);
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

