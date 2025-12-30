import type { Locator } from 'playwright';
import { BaseAdapter } from '../BaseAdapter.js';
import { SiteId } from '../SiteId.js';

/**
 * Adapter para transformar dados brutos da OLX em CarAd normalizado
 * Segue o padrão Adapter
 * Recebe um Locator do Playwright e extrai todos os dados diretamente do DOM
 */
export class OlxAdapter extends BaseAdapter {
  /**
   * Obtém o Locator do card
   */
  private getCard(): Locator {
    if (!this.rawPayload) {
      throw new Error('Payload não foi definido. Chame setPayload() antes de adapt().');
    }
    return this.rawPayload as Locator;
  }

  protected async id(): Promise<string> {
    const url = await this.url();
    // Extrair ID da URL (último segmento numérico)
    const idMatch = url.match(/-(\d+)$/);
    return idMatch ? idMatch[1] : url.split('/').pop() || 'unknown';
  }

  protected async title(): Promise<string> {
    const card = this.getCard();
    const titleLink = card.locator('a[data-testid="adcard-link"]').first();
    return (await titleLink.textContent())?.trim() || '';
  }

  protected description(): string | null {
    return null;
  }

  protected async price(): Promise<number> {
    const card = this.getCard();
    const priceElement = card.locator('h3.olx-adcard__price').first();
    const priceText = (await priceElement.textContent())?.trim() || null;
    return this.parsePrice(priceText);
  }

  protected async year(): Promise<number | null> {
    const title = await this.title();
    const yearMatch = title.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0], 10) : null;
  }

  protected async mileage(): Promise<number | null> {
    const card = this.getCard();
    const detailsContainer = card.locator('div.AdCard_autosDetails__9AiAP').first();
    const detailElements = await detailsContainer.locator('div.olx-adcard__detail').all();

    for (const detail of detailElements) {
      const ariaLabel = (await detail.getAttribute('aria-label')) || '';
      if (ariaLabel.includes('quilômetros') || ariaLabel.includes('quilometragem')) {
        const text = (await detail.textContent())?.trim() || '';
        const mileageStr = text.replace(/[^\d]/g, '');
        return mileageStr ? parseInt(mileageStr, 10) : null;
      }
    }

    return null;
  }

  protected async color(): Promise<string | null> {
    const card = this.getCard();
    const detailsContainer = card.locator('div.AdCard_autosDetails__9AiAP').first();
    const detailElements = await detailsContainer.locator('div.olx-adcard__detail').all();

    for (const detail of detailElements) {
      const ariaLabel = (await detail.getAttribute('aria-label')) || '';
      if (ariaLabel.includes('Cor')) {
        return (await detail.textContent())?.trim() || null;
      }
    }

    return null;
  }

  protected async fuel(): Promise<string | null> {
    const engine = await this.engine();
    return engine ? this.normalizeFuel(engine) : null;
  }

  protected transmission(): string | null {
    // OLX não fornece transmissão nos cards
    return null;
  }

  protected async brand(): Promise<string | null> {
    const title = await this.title();
    const { brand } = this.parseTitle(title);
    return brand;
  }

  protected async model(): Promise<string | null> {
    const title = await this.title();
    const { model } = this.parseTitle(title);
    return model;
  }

  protected async city(): Promise<string | null> {
    const location = await this.getLocation();
    const { city } = this.parseLocation(location);
    return city;
  }

  protected async state(): Promise<string | null> {
    const location = await this.getLocation();
    const { state } = this.parseLocation(location);
    return state;
  }

  protected async imageUrl(): Promise<string | null> {
    const card = this.getCard();
    const imageElement = card.locator('picture img').first();
    return (await imageElement.getAttribute('src')) || null;
  }

  protected publishedAt(): Date | null {
    // OLX não fornece data de publicação nos cards
    return null;
  }

  protected source(): string {
    return SiteId.OLX;
  }

  protected async engine(): Promise<string | null> {
    const card = this.getCard();
    const detailsContainer = card.locator('div.AdCard_autosDetails__9AiAP').first();
    const detailElements = await detailsContainer.locator('div.olx-adcard__detail').all();

    for (const detail of detailElements) {
      const ariaLabel = (await detail.getAttribute('aria-label')) || '';
      if (ariaLabel.includes('Motor')) {
        return (await detail.textContent())?.trim() || null;
      }
    }

    return null;
  }

  protected async carType(): Promise<string | null> {
    const card = this.getCard();
    const detailsContainer = card.locator('div.AdCard_autosDetails__9AiAP').first();
    const detailElements = await detailsContainer.locator('div.olx-adcard__detail').all();

    for (const detail of detailElements) {
      const ariaLabel = (await detail.getAttribute('aria-label')) || '';
      if (ariaLabel.includes('tipo')) {
        return (await detail.textContent())?.trim() || null;
      }
    }

    return null;
  }

  /**
   * Extrai a URL do card
   */
  protected async url(): Promise<string> {
    const card = this.getCard();
    const titleLink = card.locator('a[data-testid="adcard-link"]').first();
    const url = (await titleLink.getAttribute('href')) || '';
    // Garantir URL completa
    return url.startsWith('http') ? url : `https://www.olx.com.br${url}`;
  }

  /**
   * Extrai a localização do card
   */
  private async getLocation(): Promise<string | null> {
    const card = this.getCard();
    const locationElement = card.locator('p.olx-adcard__location').first();
    return (await locationElement.textContent())?.trim() || null;
  }

  protected metadata(): Record<string, unknown> {
    return {};
  }

  /**
   * Converte string de preço para centavos
   */
  private parsePrice(price: string | number | null): number {
    if (!price) return 0;
    if (typeof price === 'number') return Math.round(price * 100);

    // Remove "R$", espaços, pontos e converte vírgula para ponto
    const cleaned = price
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : Math.round(value * 100);
  }

  /**
   * Extrai cidade e estado da string de localização
   */
  private parseLocation(location: string | null): { city: string | null; state: string | null } {
    if (!location) return { city: null, state: null };

    // Formato: "Belo Horizonte, Tirol (Barreiro)" ou "Cidade, Estado"
    const parts = location.split(',').map((p) => p.trim());
    const city = parts[0] || null;
    const state = parts[1]?.match(/\(([^)]+)\)/)?.[1] || parts[1] || null;

    return { city, state };
  }

  /**
   * Extrai marca e modelo do título
   */
  private parseTitle(title: string): { brand: string | null; model: string | null } {
    if (!title) return { brand: null, model: null };

    // Formato comum: "Marca Modelo Versão Ano"
    // Ex: "Fiat Palio 1.0/ Trofeo 1.0 Fire/ Fire Flex 4P 2004"
    const words = title.split(/\s+/);
    const brand = words[0] || null;

    // Modelo geralmente são as palavras 1-3
    const model = words.slice(1, 4).join(' ').trim() || null;

    return { brand, model };
  }

  /**
   * Normaliza tipo de combustível
   */
  private normalizeFuel(engine: string): string | null {
    if (!engine) return null;

    const normalized = engine.toLowerCase();
    if (normalized.includes('flex')) {
      return 'flex';
    }
    if (normalized.includes('gasolina')) {
      return 'gasolina';
    }
    if (normalized.includes('etanol')) {
      return 'etanol';
    }
    if (normalized.includes('diesel')) {
      return 'diesel';
    }
    if (normalized.includes('elétrico') || normalized.includes('eletrico')) {
      return 'elétrico';
    }

    return engine;
  }
}

