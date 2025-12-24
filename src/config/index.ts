import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

export interface Config {
  playwright: {
    headless: boolean;
    timeout: number;
    userAgent: string;
  };
  crawler: {
    maxRetries: number;
    retryDelay: number;
    concurrentRequests: number;
  };
  logging: {
    level: string;
    file: string;
  };
}

export const config: Config = {
  playwright: {
    headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
    timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10),
    userAgent:
      process.env.PLAYWRIGHT_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  crawler: {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '2000', 10),
    concurrentRequests: parseInt(process.env.CONCURRENT_REQUESTS || '1', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/crawler.log',
  },
};
