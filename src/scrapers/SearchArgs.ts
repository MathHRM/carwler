import type { SiteId } from './SiteId.js';

/**
 * Argumentos de busca que podem ser passados para os scrapers
 * Cada driver pode interpretar esses argumentos de forma diferente
 */
export interface SearchArgs {
  /** Modelo do carro (obrigatório) */
  modelo: string;
  /** Ano máximo do carro (opcional) */
  maxYear?: number;
  /** Preço máximo do carro (opcional) */
  maxPrice?: number;
  /** Sites específicos para buscar (opcional, todos se não informado) */
  sites?: SiteId[];
}

/**
 * Valida se os argumentos de busca são válidos
 */
export function validateSearchArgs(args: Partial<SearchArgs>): args is SearchArgs {
  return typeof args.modelo === 'string' && args.modelo.trim().length > 0;
}

/**
 * Cria argumentos de busca com valores padrão
 */
export function createSearchArgs(
  modelo: string,
  options?: {
    maxYear?: number;
    maxPrice?: number;
    sites?: SiteId[];
  }
): SearchArgs {
  return {
    modelo: modelo.trim(),
    maxYear: options?.maxYear,
    maxPrice: options?.maxPrice,
    sites: options?.sites,
  };
}

