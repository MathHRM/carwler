FROM mcr.microsoft.com/playwright:v1.57.0-noble

# Criar usuário não-root para segurança
RUN adduser --disabled-password --gecos '' pwuser

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências do projeto
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Mudar para usuário não-root
USER pwuser

# Expor porta se necessário (para futuro uso com servidor)
EXPOSE 3000

# Comando padrão
CMD ["node", "dist/cli/index.js"]

