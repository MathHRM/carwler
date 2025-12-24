# Carwler

Crawler para sites de carros usando Playwright. Extrai informações de anúncios de carros (preço, cor, km, nome, ano, etc.) de diferentes sites.

## Arquitetura

O projeto segue uma arquitetura escalável que permite adicionar facilmente novos sites:

- **Strategy Pattern**: Cada site tem seu próprio scraper implementando a interface `SiteScraper`
- **Adapter Pattern**: Dados específicos de cada site são normalizados para o modelo comum `CarAd`
- **Factory Pattern**: Factory retorna o scraper correto baseado no identificador do site

## Estrutura do Projeto

```
src/
├── cli/           # Interface de linha de comando
├── config/        # Configurações (env, playwright)
├── domain/        # Modelos de domínio
├── infra/         # Infraestrutura (logger)
├── scrapers/      # Implementações de scraping
└── services/      # Serviços de orquestração
```

## Pré-requisitos

- Node.js >= 20.0.0
- npm ou yarn

## Instalação

```bash
npm install
```

## Configuração

Copie o arquivo `env.example` para `.env` e ajuste as configurações:

```bash
cp env.example .env
```

## Uso

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Execução

```bash
npm start
```

## Docker

### Build da imagem

```bash
docker build -t carwler .
```

### Execução

```bash
docker run --rm -it carwler
```

## Desenvolvimento

O projeto está em desenvolvimento ativo. A implementação do driver OLX está em andamento.

## Licença

MIT

