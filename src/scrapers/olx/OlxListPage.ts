import type { Page } from 'playwright';
import type { OlxRawAd } from './types.js';
import { logger } from '@infra/logger.js';

/**
 * Classe responsável por extrair dados de páginas de listagem da OLX
 */
export class OlxListPage {
  /**
   * Extrai todos os anúncios de uma página de listagem
   */
  async extractAds(page: Page): Promise<OlxRawAd[]> {
    logger.debug('Extraindo anúncios da página de listagem OLX');

    try {
      // Aguardar carregamento dos anúncios
      await page.waitForSelector('section.olx-adcard', { timeout: 10000 });

      // Seletores da OLX
      const adCards = await page.locator('section.olx-adcard').all();

      const ads: OlxRawAd[] = [];

      for (const card of adCards) {
        try {
          const ad = await this.extractAdFromCard(card);
          if (ad) {
            ads.push(ad);
          }
        } catch (error) {
          logger.warn('Erro ao extrair anúncio individual', { error });
        }
      }

      logger.info(`Extraídos ${ads.length} anúncios da página`);
      return ads;
    } catch (error) {
      logger.error('Erro ao extrair anúncios da listagem', { error });
      throw error;
    }
  }

  /**
   * Extrai dados de um card de anúncio individual
   */
  private async extractAdFromCard(
    card: import('playwright').Locator
  ): Promise<OlxRawAd | null> {
    try {
      // Extrair título e URL
      const titleLink = card.locator('a[data-testid="adcard-link"]').first();
      const title = (await titleLink.textContent())?.trim() || '';
      const url = (await titleLink.getAttribute('href')) || '';

      if (!title || !url) {
        return null;
      }

      // Garantir URL completa
      const fullUrl = url.startsWith('http') ? url : `https://www.olx.com.br${url}`;

      // Extrair preço
      const priceElement = card.locator('h3.olx-adcard__price').first();
      const priceText = (await priceElement.textContent())?.trim() || null;

      // Extrair localização
      const locationElement = card.locator('p.olx-adcard__location').first();
      const location = (await locationElement.textContent())?.trim() || null;

      // Extrair imagem
      const imageElement = card.locator('picture img').first();
      const imageUrl = (await imageElement.getAttribute('src')) || null;

      // Extrair detalhes (km, cor, motor, tipo)
      const detailsContainer = card.locator('div.AdCard_autosDetails__9AiAP').first();
      const detailElements = await detailsContainer.locator('div.olx-adcard__detail').all();

      let mileage: string | null = null;
      let color: string | null = null;
      let engine: string | null = null;
      let carType: string | null = null;

      for (const detail of detailElements) {
        const ariaLabel = (await detail.getAttribute('aria-label')) || '';
        const text = (await detail.textContent())?.trim() || '';

        if (ariaLabel.includes('quilômetros') || ariaLabel.includes('quilometragem')) {
          mileage = text.replace(/[^\d]/g, '');
        } else if (ariaLabel.includes('Cor')) {
          color = text;
        } else if (ariaLabel.includes('Motor')) {
          engine = text;
        } else if (ariaLabel.includes('tipo')) {
          carType = text;
        }
      }

      // Tentar extrair ano do título (ex: "Fiat Palio 1.0 2004")
      const yearMatch = title.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : null;

      return {
        title,
        price: priceText,
        location,
        url: fullUrl,
        imageUrl,
        mileage,
        color,
        engine,
        carType,
        year,
      };
    } catch (error) {
      logger.debug('Erro ao extrair dados do card', { error });
      return null;
    }
  }

  /**
   * Verifica se há próxima página
   */
  async hasNextPage(page: Page): Promise<boolean> {
    try {
      const nextButton = page.locator('a[data-lurker-detail="next_page"]').first();
      const count = await nextButton.count();
      return count > 0 && (await nextButton.isEnabled());
    } catch (error) {
      logger.debug('Erro ao verificar próxima página', { error });
      return false;
    }
  }

  /**
   * Navega para a próxima página
   */
  async goToNextPage(page: Page): Promise<boolean> {
    try {
      const hasNext = await this.hasNextPage(page);
      if (!hasNext) {
        return false;
      }

      const nextButton = page.locator('a[data-lurker-detail="next_page"]').first();
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      return true;
    } catch (error) {
      logger.error('Erro ao navegar para próxima página', { error });
      return false;
    }
  }
}

