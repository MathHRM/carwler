import type { CarAd } from '@domain/CarAd.js';

/**
 * Classe base abstrata para adapters que transformam dados brutos em CarAd
 * Segue o padrão Template Method
 */
export abstract class BaseAdapter {
  protected rawPayload: unknown | null = null;

  /**
   * Define o payload bruto e a URL para processamento
   */
  setPayload(rawPayload: unknown): void {
    this.rawPayload = rawPayload;
  }

  /**
   * Converte o payload bruto para o modelo normalizado CarAd
   * Implementa o Template Method que chama todos os métodos abstratos
   * Pode ser assíncrono se os métodos de extração forem assíncronos
   */
  async adapt(): Promise<CarAd> {
    return {
      id: await this.id(),
      title: await this.title(),
      description: await this.description(),
      price: await this.price(),
      year: await this.year(),
      mileage: await this.mileage(),
      color: await this.color(),
      fuel: await this.fuel(),
      transmission: await this.transmission(),
      brand: await this.brand(),
      model: await this.model(),
      city: await this.city(),
      state: await this.state(),
      url: await this.url(),
      imageUrl: await this.imageUrl(),
      imageUrls: await this.imageUrls(),
      publishedAt: await this.publishedAt(),
      source: this.source(),
      engine: await this.engine(),
      carType: await this.carType(),
      steering: await this.steering(),
      doors: await this.doors(),
      hasGNV: await this.hasGNV(),
      neighborhood: await this.neighborhood(),
      zipCode: await this.zipCode(),
      sellerName: await this.sellerName(),
      sellerType: await this.sellerType(),
      sellerReputation: await this.sellerReputation(),
      sellerTimeOnOlx: await this.sellerTimeOnOlx(),
      averagePrice: await this.averagePrice(),
      fipePrice: await this.fipePrice(),
      installment: await this.installment(),
      downPayment: await this.downPayment(),
      optionalFeatures: await this.optionalFeatures(),
      extraInfo: await this.extraInfo(),
      metadata: {
        ...this.metadata(),
      },
    };
  }

  /**
   * Métodos abstratos que devem ser implementados por cada adapter
   * Podem ser síncronos ou assíncronos dependendo da implementação
   */
  protected abstract id(): string | Promise<string>;
  protected abstract title(): string | Promise<string>;
  protected abstract description(): string | null | Promise<string | null>;
  protected abstract price(): number | Promise<number>;
  protected abstract year(): number | null | Promise<number | null>;
  protected abstract mileage(): number | null | Promise<number | null>;
  protected abstract color(): string | null | Promise<string | null>;
  protected abstract fuel(): string | null | Promise<string | null>;
  protected abstract transmission(): string | null | Promise<string | null>;
  protected abstract brand(): string | null | Promise<string | null>;
  protected abstract model(): string | null | Promise<string | null>;
  protected abstract city(): string | null | Promise<string | null>;
  protected abstract state(): string | null | Promise<string | null>;
  protected abstract imageUrl(): string | null | Promise<string | null>;
  protected abstract imageUrls(): string[] | Promise<string[]>;
  protected abstract publishedAt(): Date | null | Promise<Date | null>;
  protected abstract url(): string | Promise<string>;
  protected abstract source(): string;
  protected abstract engine(): string | null | Promise<string | null>;
  protected abstract carType(): string | null | Promise<string | null>;
  protected abstract steering(): string | null | Promise<string | null>;
  protected abstract doors(): string | null | Promise<string | null>;
  protected abstract hasGNV(): boolean | null | Promise<boolean | null>;
  protected abstract neighborhood(): string | null | Promise<string | null>;
  protected abstract zipCode(): string | null | Promise<string | null>;
  protected abstract sellerName(): string | null | Promise<string | null>;
  protected abstract sellerType(): string | null | Promise<string | null>;
  protected abstract sellerReputation(): string | null | Promise<string | null>;
  protected abstract sellerTimeOnOlx(): string | null | Promise<string | null>;
  protected abstract averagePrice(): number | null | Promise<number | null>;
  protected abstract fipePrice(): number | null | Promise<number | null>;
  protected abstract installment(): string | null | Promise<string | null>;
  protected abstract downPayment(): string | null | Promise<string | null>;
  protected abstract optionalFeatures(): string[] | Promise<string[]>;
  protected abstract extraInfo(): string[] | Promise<string[]>;
  protected abstract metadata(): Record<string, unknown>;
}

