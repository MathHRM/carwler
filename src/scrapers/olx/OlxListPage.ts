import type { Page, Locator } from 'playwright';
import { logger } from '@infra/logger.js';

/**
 * Classe responsável por extrair dados de páginas de listagem da OLX
 */
export class OlxListPage {
  /**
   * Extrai todos os anúncios de uma página de listagem
   * Retorna apenas os Locators dos cards, sem processar os dados
   */
  async extractAds(page: Page): Promise<Locator[]> {
    logger.debug('Extraindo anúncios da página de listagem OLX');

    try {
      // Aguardar carregamento dos anúncios
      await page.waitForSelector('section.olx-adcard', { timeout: 10000 });

      // Seletores da OLX
      const adCards = await page.locator('section.olx-adcard').all();

      logger.info(`Extraídos ${adCards.length} cards válidos da página`);
      return adCards;
    } catch (error) {
      logger.error('Erro ao extrair anúncios da listagem', { error });
      throw error;
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

