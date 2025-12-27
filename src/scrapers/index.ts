/**
 * Arquivo de inicialização dos scrapers
 * Importa todos os scrapers para que sejam registrados na factory
 */

// Importar scrapers (o registro acontece automaticamente no import)
import './olx/index.js';

// Exportar tipos e classes principais
export * from './SiteScraper.js';
export * from './BaseScraper.js';
export * from './BaseAdapter.js';
export * from './ScraperFactory.js';
export * from './SiteId.js';
export * from './SearchArgs.js';
export * from './types.js';

