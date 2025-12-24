---
description: "Arquitetura e padrões de design do projeto Carwler"
alwaysApply: true
---

# Arquitetura do Projeto Carwler

## Visão Geral

Este projeto implementa um crawler escalável para sites de carros usando Playwright, seguindo princípios SOLID e padrões de design bem estabelecidos.

## Padrões de Design

### 1. Strategy Pattern
Cada site (OLX, Webmotors, Facebook) tem seu próprio scraper que implementa a interface `SiteScraper`. Isso permite adicionar novos sites facilmente sem modificar código existente.

### 2. Adapter Pattern
Cada scraper possui um adapter que transforma dados específicos do site em um modelo normalizado `CarAd`. Isso garante que todos os scrapers retornem dados no mesmo formato.

### 3. Factory Pattern
A `ScraperFactory` é responsável por criar instâncias dos scrapers corretos baseado no identificador do site ou URL. Mantém o código de orquestração desacoplado.

### 4. Dependency Injection
Serviços recebem dependências via construtor, facilitando testes e manutenção.

## Estrutura de Diretórios

```
src/
├── cli/           # Interface de linha de comando
├── config/        # Configurações (env, playwright)
├── domain/        # Modelos de domínio (CarAd)
├── infra/         # Infraestrutura (logger)
├── scrapers/      # Implementações de scraping
│   ├── olx/       # Driver OLX
│   ├── webmotors/ # Driver Webmotors (futuro)
│   └── facebook/  # Driver Facebook (futuro)
└── services/      # Serviços de orquestração
```

## Convenções de Código

- Use TypeScript com strict mode habilitado
- Siga princípios SOLID
- Use async/await para operações assíncronas
- Trate erros adequadamente com try/catch
- Use o logger para todas as operações importantes
- Documente funções e classes com JSDoc quando necessário

## Path Aliases

O projeto usa path aliases definidos no tsconfig.json:
- `@config/*` → `src/config/*`
- `@domain/*` → `src/domain/*`
- `@infra/*` → `src/infra/*`
- `@scrapers/*` → `src/scrapers/*`
- `@services/*` → `src/services/*`
- `@cli/*` → `src/cli/*`

## Adicionando um Novo Site

Para adicionar um novo site:

1. Crie uma pasta em `src/scrapers/{nome-site}/`
2. Implemente os arquivos:
   - `{Nome}ListPage.ts` - Extração de listagens
   - `{Nome}DetailPage.ts` - Extração de detalhes
   - `{Nome}Adapter.ts` - Normalização para CarAd
   - `{Nome}Scraper.ts` - Implementação de SiteScraper
3. Registre o scraper na `ScraperFactory`

