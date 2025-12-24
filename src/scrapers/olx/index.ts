/**
 * Módulo de exportação do scraper OLX
 * Registra o scraper na factory
 */
import { ScraperFactory } from '../ScraperFactory.js';
import { SiteId } from '../SiteId.js';
import { OlxScraper } from './OlxScraper.js';

// Registrar o scraper OLX na factory
ScraperFactory.register(SiteId.OLX, () => new OlxScraper());

