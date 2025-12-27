import type { CarAd } from '@domain/CarAd.js';

/**
 * Classe base abstrata para adapters que transformam dados brutos em CarAd
 * Segue o padrão Template Method
 */
export abstract class BaseAdapter {
  protected rawPayload: unknown | null = null;
  protected url: string = '';

  /**
   * Define o payload bruto e a URL para processamento
   */
  setPayload(rawPayload: unknown, url: string): void {
    this.rawPayload = rawPayload;
    this.url = url;
  }

  /**
   * Converte o payload bruto para o modelo normalizado CarAd
   * Implementa o Template Method que chama todos os métodos abstratos
   */
  adapt(): CarAd {
    return {
      id: this.id(),
      title: this.title(),
      price: this.price(),
      year: this.year(),
      mileage: this.mileage(),
      color: this.color(),
      fuel: this.fuel(),
      transmission: this.transmission(),
      brand: this.brand(),
      model: this.model(),
      city: this.city(),
      state: this.state(),
      url: this.url,
      imageUrl: this.imageUrl(),
      publishedAt: this.publishedAt(),
      source: this.source(),
      engine: this.engine(),
      carType: this.carType(),
      metadata: {
        ...this.metadata(),
      },
    };
  }

  /**
   * Métodos abstratos que devem ser implementados por cada adapter
   */
  protected abstract id(): string;
  protected abstract title(): string;
  protected abstract price(): number;
  protected abstract year(): number | null;
  protected abstract mileage(): number | null;
  protected abstract color(): string | null;
  protected abstract fuel(): string | null;
  protected abstract transmission(): string | null;
  protected abstract brand(): string | null;
  protected abstract model(): string | null;
  protected abstract city(): string | null;
  protected abstract state(): string | null;
  protected abstract imageUrl(): string | null;
  protected abstract publishedAt(): Date | null;
  protected abstract source(): string;
  protected abstract engine(): string | null;
  protected abstract carType(): string | null;
  protected abstract metadata(): Record<string, unknown>;
}

