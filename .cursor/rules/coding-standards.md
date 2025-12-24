---
description: "Padrões de código e boas práticas para o projeto"
alwaysApply: true
---

# Padrões de Código e Boas Práticas

## TypeScript

- Sempre use TypeScript com strict mode
- Defina tipos explícitos para parâmetros e retornos de funções
- Use interfaces para contratos e types para uniões/intersecções
- Evite `any` - use `unknown` quando necessário e faça type guards

## Tratamento de Erros

- Sempre use try/catch para operações assíncronas que podem falhar
- Logue erros usando o logger antes de relançar ou retornar
- Forneça mensagens de erro descritivas
- Use retry logic para operações de rede (já implementado em BaseScraper)

## Playwright

- Sempre feche browsers, contexts e pages após uso
- Use `waitForSelector` ou `waitForLoadState` antes de interagir com elementos
- Use locators ao invés de seletores diretos quando possível
- Aguarde `networkidle` para garantir que a página carregou completamente

## Logging

- Use o logger importado de `@infra/logger` para todas as operações importantes
- Níveis de log:
  - `error`: Erros que impedem a execução
  - `warn`: Situações que podem causar problemas mas não impedem execução
  - `info`: Informações importantes do fluxo
  - `debug`: Informações detalhadas para debugging

## Normalização de Dados

- Todos os scrapers devem retornar dados no formato `CarAd`
- Use adapters para transformar dados brutos em `CarAd`
- Valide dados antes de retornar usando `isValidCarAd` quando apropriado
- Trate valores nulos/indefinidos adequadamente

## Performance

- Use delays aleatórios entre requisições para evitar detecção
- Limite o número de páginas processadas por padrão
- Implemente paginação de forma eficiente
- Não persista dados desnecessários (apenas exiba no console por enquanto)

