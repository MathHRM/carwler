import { chromium, Browser, BrowserContext, Page, LaunchOptions } from 'playwright';
import { config } from './index.js';
import { logger } from '@infra/logger.js';

/**
 * Cria uma nova instância do browser com as configurações padrão
 */
export async function createBrowser(options?: LaunchOptions): Promise<Browser> {
  const launchOptions: LaunchOptions = {
    headless: config.playwright.headless,
    ...options,
  };

  logger.info('Iniciando browser Playwright', { headless: launchOptions.headless });
  const browser = await chromium.launch(launchOptions);
  return browser;
}

/**
 * Cria um novo contexto do browser com configurações padrão
 */
export async function createContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext({
    userAgent: config.playwright.userAgent,
    viewport: { width: 1920, height: 1080 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });

  logger.info('Contexto do browser criado');
  return context;
}

/**
 * Cria uma nova página no contexto
 */
export async function createPage(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  page.setDefaultTimeout(config.playwright.timeout);
  logger.info('Nova página criada');
  return page;
}

/**
 * Factory para criar browser, context e page de uma vez
 */
export async function createPlaywrightInstance(
  options?: LaunchOptions
): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const browser = await createBrowser(options);
  const context = await createContext(browser);
  const page = await createPage(context);

  return { browser, context, page };
}

/**
 * Fecha browser, context e page de forma segura
 */
export async function closePlaywrightInstance(
  browser: Browser | null,
  context: BrowserContext | null,
  page: Page | null
): Promise<void> {
  try {
    if (page) {
      await page.close();
      logger.debug('Página fechada');
    }
    if (context) {
      await context.close();
      logger.debug('Contexto fechado');
    }
    if (browser) {
      await browser.close();
      logger.info('Browser fechado');
    }
  } catch (error) {
    logger.error('Erro ao fechar instância do Playwright', { error });
    throw error;
  }
}

