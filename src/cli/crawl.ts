import { Command } from 'commander';
import chalk from 'chalk';
import { CrawlService } from '@services/CrawlService.js';
import { createSearchArgs, validateSearchArgs } from '@scrapers/SearchArgs.js';
import { SiteId, parseSiteId, getAllSiteIds, SITE_NAMES } from '@scrapers/SiteId.js';
import { ScraperFactory } from '@scrapers/ScraperFactory.js';
import { logger } from '@infra/logger.js';

// Importar scrapers para garantir registro
import '@scrapers/index.js';

/**
 * Formata preço em centavos para exibição
 */
function formatPrice(priceInCents: number): string {
  const priceInReais = priceInCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(priceInReais);
}

/**
 * Formata número com separador de milhar
 */
function formatNumber(num: number | null): string {
  if (num === null) return 'N/A';
  return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Exibe resultados em formato de tabela
 */
function displayResultsTable(ads: import('@domain/CarAd.js').CarAd[]): void {
  if (ads.length === 0) {
    console.log(chalk.yellow('Nenhum anúncio encontrado.'));
    return;
  }

  console.log(chalk.bold(`\n${ads.length} anúncio(s) encontrado(s):\n`));
  console.log(chalk.gray('─'.repeat(120)));

  ads.forEach((ad, index) => {
    console.log(chalk.bold(`\n${index + 1}. ${ad.title}`));
    console.log(`   ${chalk.cyan('Preço:')} ${chalk.green(formatPrice(ad.price))}`);
    console.log(`   ${chalk.cyan('Ano:')} ${ad.year ? chalk.yellow(ad.year.toString()) : chalk.gray('N/A')}`);
    console.log(`   ${chalk.cyan('KM:')} ${ad.mileage ? formatNumber(ad.mileage) : chalk.gray('N/A')}`);
    console.log(`   ${chalk.cyan('Cor:')} ${ad.color || chalk.gray('N/A')}`);
    console.log(`   ${chalk.cyan('Combustível:')} ${ad.fuel || chalk.gray('N/A')}`);
    console.log(`   ${chalk.cyan('Marca:')} ${ad.brand || chalk.gray('N/A')}`);
    console.log(`   ${chalk.cyan('Modelo:')} ${ad.model || chalk.gray('N/A')}`);
    console.log(`   ${chalk.cyan('Localização:')} ${ad.city || chalk.gray('N/A')}${ad.state ? `, ${ad.state}` : ''}`);
    console.log(`   ${chalk.cyan('Site:')} ${chalk.magenta(SITE_NAMES[ad.source as SiteId] || ad.source)}`);
    console.log(`   ${chalk.cyan('URL:')} ${chalk.blue(ad.url)}`);
    if (index < ads.length - 1) {
      console.log(chalk.gray('─'.repeat(120)));
    }
  });

  console.log(chalk.gray('\n─'.repeat(120)));
}

/**
 * Exibe resultados em formato JSON
 */
function displayResultsJSON(ads: import('@domain/CarAd.js').CarAd[]): void {
  console.log(JSON.stringify(ads, null, 2));
}

/**
 * Configura e executa o comando de crawling
 */
export function setupCrawlCommand(): Command {
  const program = new Command();

  program
    .name('carwler')
    .description('Crawler para sites de carros usando Playwright')
    .version('1.0.0');

  program
    .command('crawl')
    .description('Faz crawling de anúncios de carros')
    .requiredOption('-m, --modelo <modelo>', 'Modelo do carro (obrigatório)')
    .option('-y, --max-year <ano>', 'Ano máximo do carro', (value) => parseInt(value, 10))
    .option('-p, --max-price <preco>', 'Preço máximo do carro em reais', (value) => parseInt(value, 10))
    .option(
      '-s, --site <site>',
      `Site para buscar (${getAllSiteIds().join(', ')}, ou 'todos' para todos os sites)`,
      'todos'
    )
    .option('-f, --format <formato>', 'Formato de saída (table, json)', 'table')
    .option('--all-pages', 'Processar todas as páginas (padrão: apenas primeira página)', false)
    .action(async (options) => {
      try {
        // Validar argumentos
        const searchArgs = createSearchArgs(options.modelo, {
          maxYear: options.maxYear,
          maxPrice: options.maxPrice,
        });

        if (!validateSearchArgs(searchArgs)) {
          console.error(chalk.red('Erro: modelo é obrigatório e deve ser uma string não vazia.'));
          process.exit(1);
        }

        // Determinar sites para processar
        let sites: SiteId[] = [];
        if (options.site === 'todos' || !options.site) {
          sites = getAllSiteIds();
        } else {
          const siteId = parseSiteId(options.site);
          if (!siteId) {
            console.error(
              chalk.red(
                `Erro: site '${options.site}' não é válido. Sites disponíveis: ${getAllSiteIds().join(', ')}, ou 'todos'`
              )
            );
            process.exit(1);
          }
          sites = [siteId];
        }

        // Verificar se os sites estão registrados
        for (const siteId of sites) {
          if (!ScraperFactory.hasScraper(siteId)) {
            console.warn(
              chalk.yellow(`Aviso: scraper para '${siteId}' não está registrado. Pulando...`)
            );
          }
        }

        // Filtrar apenas sites registrados
        const availableSites = sites.filter((siteId) => ScraperFactory.hasScraper(siteId));

        if (availableSites.length === 0) {
          console.error(chalk.red('Erro: nenhum scraper disponível para os sites solicitados.'));
          process.exit(1);
        }

        // Exibir informações da busca
        console.log(chalk.bold('\n🔍 Iniciando busca de carros...\n'));
        console.log(chalk.cyan(`Modelo: ${chalk.bold(searchArgs.modelo)}`));
        if (searchArgs.maxYear) {
          console.log(chalk.cyan(`Ano máximo: ${chalk.bold(searchArgs.maxYear)}`));
        }
        if (searchArgs.maxPrice) {
          console.log(chalk.cyan(`Preço máximo: ${chalk.bold(formatPrice(searchArgs.maxPrice * 100))}`));
        }
        console.log(
          chalk.cyan(
            `Sites: ${chalk.bold(availableSites.map((s) => SITE_NAMES[s]).join(', '))}`
          )
        );
        console.log('');

        // Executar crawling
        const crawlService = new CrawlService();
        const result = await crawlService.crawlWithBrowser({
          searchArgs,
          sites: availableSites,
          allPages: options.allPages,
        });

        // Exibir resultados
        if (result.success) {
          if (options.format === 'json') {
            displayResultsJSON(result.ads);
          } else {
            displayResultsTable(result.ads);
          }

          // Exibir resumo
          console.log(chalk.bold(`\n✅ Busca concluída!`));
          console.log(chalk.gray(`Total: ${result.total} anúncio(s)`));
          console.log(chalk.gray(`Duração: ${(result.metadata.duration / 1000).toFixed(2)}s`));
        } else {
          console.error(chalk.red('\n❌ Erro durante a busca:'));
          result.errors.forEach((error) => {
            console.error(chalk.red(`  - ${error}`));
          });

          // Ainda exibir resultados parciais se houver
          if (result.ads.length > 0) {
            console.log(chalk.yellow(`\n⚠️  Exibindo ${result.ads.length} anúncio(s) encontrado(s) antes do erro:`));
            if (options.format === 'json') {
              displayResultsJSON(result.ads);
            } else {
              displayResultsTable(result.ads);
            }
          }

          process.exit(1);
        }
      } catch (error) {
        logger.error('Erro ao executar crawling', { error });
        console.error(chalk.red(`\n❌ Erro inesperado: ${error instanceof Error ? error.message : String(error)}`));
        process.exit(1);
      }
    });

  return program;
}

