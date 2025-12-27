import type { OlxRawAd } from './types.js';
import { BaseAdapter } from '../BaseAdapter.js';
import { SiteId } from '../SiteId.js';

/**
 * Adapter para transformar dados brutos da OLX em CarAd normalizado
 * Segue o padrão Adapter
 */
export class OlxAdapter extends BaseAdapter {
  /**
   * Obtém o payload raw tipado
   */
  private getRawAd(): OlxRawAd {
    if (!this.rawPayload) {
      throw new Error('Payload não foi definido. Chame setPayload() antes de adapt().');
    }
    return this.rawPayload as OlxRawAd;
  }

  protected id(): string {
    // Extrair ID da URL (último segmento numérico)
    const idMatch = this.url.match(/-(\d+)$/);
    return idMatch ? idMatch[1] : this.url.split('/').pop() || 'unknown';
  }

  protected title(): string {
    return this.getRawAd().title;
  }

  protected price(): number {
    return this.parsePrice(this.getRawAd().price);
  }

  protected year(): number | null {
    const rawAd = this.getRawAd();
    return rawAd.year ? parseInt(rawAd.year, 10) : null;
  }

  protected mileage(): number | null {
    const rawAd = this.getRawAd();
    return rawAd.mileage ? parseInt(rawAd.mileage, 10) : null;
  }

  protected color(): string | null {
    return this.getRawAd().color;
  }

  protected fuel(): string | null {
    const rawAd = this.getRawAd();
    return rawAd.engine ? this.normalizeFuel(rawAd.engine) : null;
  }

  protected transmission(): string | null {
    // OLX não fornece transmissão nos cards
    return null;
  }

  protected brand(): string | null {
    const { brand } = this.parseTitle(this.getRawAd().title);
    return brand;
  }

  protected model(): string | null {
    const { model } = this.parseTitle(this.getRawAd().title);
    return model;
  }

  protected city(): string | null {
    const { city } = this.parseLocation(this.getRawAd().location);
    return city;
  }

  protected state(): string | null {
    const { state } = this.parseLocation(this.getRawAd().location);
    return state;
  }

  protected imageUrl(): string | null {
    return this.getRawAd().imageUrl;
  }

  protected publishedAt(): Date | null {
    // OLX não fornece data de publicação nos cards
    return null;
  }

  protected source(): string {
    return SiteId.OLX;
  }

  protected engine(): string | null {
    return this.getRawAd().engine;
  }

  protected carType(): string | null {
    return this.getRawAd().carType;
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

