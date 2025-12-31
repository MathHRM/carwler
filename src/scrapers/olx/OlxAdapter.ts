import type { Locator } from 'playwright';
import { BaseAdapter } from '../BaseAdapter.js';
import { SiteId } from '../SiteId.js';

/**
 * Adapter para transformar dados brutos da OLX em CarAd normalizado
 * Segue o padrão Adapter
 * Recebe um Locator do Playwright da página detalhada e extrai todos os dados diretamente do DOM
 */
export class OlxAdapter extends BaseAdapter {
  private currentUrl: string = '';

  /**
   * Define o payload e a URL atual
   */
  setPayload(rawPayload: unknown, url?: string): void {
    super.setPayload(rawPayload);
    if (url) {
      this.currentUrl = url;
    }
  }

  /**
   * Obtém o Locator da página detalhada
   */
  private getPage(): Locator {
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
    const page = this.getPage();
    const titleElement = page.locator('div#description-title .bdcWAn').first();
    return (await titleElement.textContent())?.trim() || '';
  }

  protected async description(): Promise<string | null> {
    const page = this.getPage();
    const descElement = page.locator('div[data-section="description"] span.typo-body-medium').first();
    const text = (await descElement.textContent())?.trim() || null;
    return text || null;
  }

  protected async price(): Promise<number> {
    const page = this.getPage();
    const priceElement = page.locator('div#price-box-container .typo-title-large').first();
    const priceText = (await priceElement.textContent())?.trim() || null;
    return this.parsePrice(priceText);
  }

  protected async year(): Promise<number | null> {
    const page = this.getPage();
    const yearElement = page.locator('div:has(> span:text-is("Ano")) a').first();
    const yearText = (await yearElement.textContent())?.trim() || null;
    if (yearText) {
      const yearMatch = yearText.match(/\b(19|20)\d{2}\b/);
      return yearMatch ? parseInt(yearMatch[0], 10) : null;
    }
    return null;
  }

  protected async mileage(): Promise<number | null> {
    const page = this.getPage();
    const mileageElement = page.locator('div:has(> span:text-is("Quilometragem")) span.ekhFnR').first();
    const mileageText = (await mileageElement.textContent())?.trim() || null;
    if (mileageText) {
      const mileageStr = mileageText.replace(/[^\d]/g, '');
      return mileageStr ? parseInt(mileageStr, 10) : null;
    }
    return null;
  }

  protected async color(): Promise<string | null> {
    const page = this.getPage();
    const colorElement = page.locator('div:has(> span:text-is("Cor")) span.ekhFnR').first();
    return (await colorElement.textContent())?.trim() || null;
  }

  protected async fuel(): Promise<string | null> {
    const page = this.getPage();
    const fuelElement = page.locator('div:has(> span:text-is("Combustível")) a').first();
    const fuelText = (await fuelElement.textContent())?.trim() || null;
    return fuelText ? this.normalizeFuel(fuelText) : null;
  }

  protected async transmission(): Promise<string | null> {
    const page = this.getPage();
    const transmissionElement = page.locator('div:has(> span:text-is("Câmbio")) span.ekhFnR').first();
    return (await transmissionElement.textContent())?.trim() || null;
  }

  protected async brand(): Promise<string | null> {
    const page = this.getPage();
    const brandElement = page.locator('div:has(> span:text-is("Marca")) a').first();
    return (await brandElement.textContent())?.trim() || null;
  }

  protected async model(): Promise<string | null> {
    const page = this.getPage();
    const modelElement = page.locator('div:has(> span:text-is("Modelo")) a').first();
    return (await modelElement.textContent())?.trim() || null;
  }

  protected async city(): Promise<string | null> {
    const page = this.getPage();
    const cityElement = page.locator('#location .font-semibold').first();
    return (await cityElement.textContent())?.trim() || null;
  }

  protected async state(): Promise<string | null> {
    const page = this.getPage();
    const stateElement = page.locator('#location .text-neutral-110').first();
    const stateText = (await stateElement.textContent())?.trim() || null;
    if (stateText) {
      // Formato: "MG, 37270000" - extrair estado
      const parts = stateText.split(',').map((p) => p.trim());
      return parts[0] || null;
    }
    return null;
  }

  protected async imageUrl(): Promise<string | null> {
    const urls = await this.imageUrls();
    return urls.length > 0 ? urls[0] : null;
  }

  protected async imageUrls(): Promise<string[]> {
    const page = this.getPage();
    const imageElements = await page.locator('div#gallery img').all();
    const urls: string[] = [];

    for (const img of imageElements) {
      const src = await img.getAttribute('src');
      const srcset = await img.getAttribute('srcset');
      if (src) {
        urls.push(src);
      } else if (srcset) {
        // srcset pode ter múltiplas URLs, pegar a primeira
        const firstUrl = srcset.split(',')[0]?.trim().split(' ')[0];
        if (firstUrl) {
          urls.push(firstUrl);
        }
      }
    }

    return urls;
  }

  protected async publishedAt(): Promise<Date | null> {
    const page = this.getPage();
    const dateElement = page.locator('div.ad__sc-ihngls-0 span.font-semibold').first();
    const dateText = (await dateElement.textContent())?.trim() || null;
    if (dateText) {
      return this.parsePublishedDate(dateText);
    }
    return null;
  }

  protected source(): string {
    return SiteId.OLX;
  }

  protected async engine(): Promise<string | null> {
    // Engine não está na tabela fornecida, manter lógica anterior se necessário
    // Por enquanto retornar null, pode ser extraído de outros campos se necessário
    return null;
  }

  protected async carType(): Promise<string | null> {
    // CarType não está na tabela fornecida, manter lógica anterior se necessário
    return null;
  }

  /**
   * Extrai a URL da página detalhada
   */
  protected async url(): Promise<string> {
    return this.currentUrl;
  }

  protected async steering(): Promise<string | null> {
    const page = this.getPage();
    const steeringElement = page.locator('div:has(> span:text-is("Direção")) span.ekhFnR').first();
    return (await steeringElement.textContent())?.trim() || null;
  }

  protected async doors(): Promise<string | null> {
    const page = this.getPage();
    const doorsElement = page.locator('div:has(> span:text-is("Portas")) span.ekhFnR').first();
    return (await doorsElement.textContent())?.trim() || null;
  }

  protected async hasGNV(): Promise<boolean | null> {
    const page = this.getPage();
    const gnvElement = page.locator('div:has(> span:text-is("Possui Kit GNV")) span.ekhFnR').first();
    const gnvText = (await gnvElement.textContent())?.trim() || null;
    if (!gnvText) return null;
    const normalized = gnvText.toLowerCase();
    return normalized.includes('sim') || normalized.includes('yes');
  }

  protected async neighborhood(): Promise<string | null> {
    const page = this.getPage();
    const locationElements = await page.locator('#location .font-semibold').all();
    // Primeiro elemento é cidade/bairro, segundo pode ser bairro se houver
    if (locationElements.length > 1) {
      return (await locationElements[1].textContent())?.trim() || null;
    }
    return null;
  }

  protected async zipCode(): Promise<string | null> {
    const page = this.getPage();
    const stateElement = page.locator('#location .text-neutral-110').first();
    const stateText = (await stateElement.textContent())?.trim() || null;
    if (stateText) {
      // Formato: "MG, 37270000" - extrair CEP
      const parts = stateText.split(',').map((p) => p.trim());
      const cep = parts[1] || null;
      return cep && /^\d{8}$/.test(cep.replace(/\D/g, '')) ? cep.replace(/\D/g, '') : null;
    }
    return null;
  }

  protected async sellerName(): Promise<string | null> {
    const page = this.getPage();
    const sellerElement = page.locator('.ad__sc-ypp2u2-4').first();
    return (await sellerElement.textContent())?.trim() || null;
  }

  protected async sellerType(): Promise<string | null> {
    const page = this.getPage();
    const typeElement = page.locator('.ad__sc-ypp2u2-1 span.typo-overline').first();
    return (await typeElement.textContent())?.trim() || null;
  }

  protected async sellerReputation(): Promise<string | null> {
    return null;
  }

  protected async sellerTimeOnOlx(): Promise<string | null> {
    return null;
  }

  protected async averagePrice(): Promise<number | null> {
    const page = this.getPage();
    const priceElement = page.locator('div:has-text("Preço Médio OLX") span.olx-text--bold').first();
    const priceText = (await priceElement.textContent())?.trim() || null;
    return priceText ? this.parsePrice(priceText) : null;
  }

  protected async fipePrice(): Promise<number | null> {
    const page = this.getPage();
    const priceElement = page.locator('div:has-text("preço fipe") span.olx-text--bold').first();
    const priceText = (await priceElement.textContent())?.trim() || null;
    return priceText ? this.parsePrice(priceText) : null;
  }

  protected async installment(): Promise<string | null> {
    return null;
  }

  protected async downPayment(): Promise<string | null> {
    return null;
  }

  protected async optionalFeatures(): Promise<string[]> {
    const page = this.getPage();
    const featuresElement = page.locator('.ad__sc-1jr3zuf-1 >> nth=0 >> span.font-semibold').first();
    const featuresText = (await featuresElement.textContent())?.trim() || null;
    if (featuresText) {
      // Dividir por vírgula ou quebra de linha
      return featuresText.split(/[,\n]/).map((f) => f.trim()).filter((f) => f.length > 0);
    }
    return [];
  }

  protected async extraInfo(): Promise<string[]> {
    const page = this.getPage();
    const extraElement = page.locator('.ad__sc-1jr3zuf-1 >> nth=1 >> span.font-semibold').first();
    const extraText = (await extraElement.textContent())?.trim() || null;
    if (extraText) {
      // Dividir por vírgula ou quebra de linha
      return extraText.split(/[,\n]/).map((e) => e.trim()).filter((e) => e.length > 0);
    }
    return [];
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

  /**
   * Parse data de publicação no formato "29/12 às 15:26"
   */
  private parsePublishedDate(dateText: string): Date | null {
    try {
      // Formato: "29/12 às 15:26" ou similar
      // Assumir ano atual se não especificado
      const now = new Date();
      const currentYear = now.getFullYear();
      
      // Extrair dia e mês
      const match = dateText.match(/(\d{1,2})\/(\d{1,2})/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // Mês é 0-indexed
        
        // Extrair hora e minuto se disponível
        const timeMatch = dateText.match(/(\d{1,2}):(\d{2})/);
        let hour = 0;
        let minute = 0;
        if (timeMatch) {
          hour = parseInt(timeMatch[1], 10);
          minute = parseInt(timeMatch[2], 10);
        }
        
        const date = new Date(currentYear, month, day, hour, minute);
        
        // Se a data for no futuro, assumir ano anterior
        if (date > now) {
          date.setFullYear(currentYear - 1);
        }
        
        return date;
      }
    } catch (error) {
      // Se falhar, retornar null
    }
    return null;
  }
}

