import type { CarAd } from '@domain/CarAd.js';
import type { OlxRawAd } from './types.js';
import { SiteId } from '../SiteId.js';

/**
 * Adapter para transformar dados brutos da OLX em CarAd normalizado
 * Segue o padrão Adapter
 */
export class OlxAdapter {
  /**
   * Converte um anúncio bruto da OLX para o modelo normalizado CarAd
   */
  adapt(rawAd: OlxRawAd, url: string): CarAd {
    // Extrair ID da URL (último segmento numérico)
    const idMatch = url.match(/-(\d+)$/);
    const id = idMatch ? idMatch[1] : url.split('/').pop() || 'unknown';

    // Converter preço para centavos
    const price = this.parsePrice(rawAd.price);

    // Converter ano
    const year = rawAd.year ? parseInt(rawAd.year, 10) : null;

    // Converter quilometragem
    const mileage = rawAd.mileage ? parseInt(rawAd.mileage, 10) : null;

    // Extrair cidade e estado da localização
    const { city, state } = this.parseLocation(rawAd.location);

    // Extrair marca e modelo do título
    const { brand, model } = this.parseTitle(rawAd.title);

    return {
      id,
      title: rawAd.title,
      price,
      year,
      mileage,
      color: rawAd.color,
      fuel: rawAd.engine ? this.normalizeFuel(rawAd.engine) : null,
      transmission: null, // OLX não fornece transmissão nos cards
      brand,
      model,
      city,
      state,
      url,
      imageUrl: rawAd.imageUrl,
      publishedAt: null, // OLX não fornece data de publicação nos cards
      source: SiteId.OLX,
      metadata: {
        engine: rawAd.engine,
        carType: rawAd.carType,
      },
    };
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
    if (normalized.includes('flex') || normalized.includes('flex')) {
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

