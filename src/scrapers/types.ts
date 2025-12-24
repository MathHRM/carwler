import type { CarAd } from '@domain/CarAd.js';

/**
 * Resultado de uma operação de scraping
 */
export interface ScrapingResult<T = CarAd> {
  success: boolean;
  data: T | T[] | null;
  error?: string;
  metadata?: {
    url?: string;
    timestamp?: Date;
    duration?: number;
  };
}

/**
 * Opções para operações de scraping
 */
export interface ScrapingOptions {
  /** URL para fazer scraping */
  url?: string;
  /** Número máximo de páginas para processar (para listagens) */
  maxPages?: number;
  /** Timeout em milissegundos */
  timeout?: number;
  /** Aguardar antes de fazer requisições (em ms) */
  delay?: number;
}

/**
 * Dados brutos extraídos de uma página antes da normalização
 */
export interface RawScrapingData {
  [key: string]: unknown;
}

