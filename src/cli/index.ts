#!/usr/bin/env node

/**
 * Entry point da CLI
 */
import { setupCrawlCommand } from './crawl.js';

const program = setupCrawlCommand();

// Parse argumentos da linha de comando
program.parse(process.argv);

// Se nenhum comando foi fornecido, exibir ajuda
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

