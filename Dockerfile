# --- ESTÁGIO BASE ---
# Usamos a imagem oficial do Playwright porque ela já contém todas as 
# dependências de sistema (libs do Linux) para rodar Chromium, Firefox e Webkit.
FROM mcr.microsoft.com/playwright:v1.57.0-jammy AS base

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# --- ESTÁGIO DE DESENVOLVIMENTO ---
FROM base AS development
# Instala todas as dependências (incluindo devDependencies como nodemon, jest, etc)
RUN npm install

# Copia o código fonte
COPY . .

# Por padrão, inicia em modo de espera ou rodando um script de "watch"
# Isso facilita o uso como CLI ou API durante o desenvolvimento
CMD ["npm", "run", "dev"]

# --- ESTÁGIO DE PRODUÇÃO ---
FROM base AS production
# Instala apenas dependências necessárias para rodar o app
RUN npm ci --omit=dev

# Copia apenas o código necessário
COPY . .

# Comando para rodar a aplicação em produção
CMD ["node", "src/index.js"]