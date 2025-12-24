FROM mcr.microsoft.com/playwright:v1.57.0-noble

# A imagem base já possui o usuário pwuser, então apenas definimos o diretório de trabalho
# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar todas as dependências (incluindo devDependencies para compilar)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript (ainda como root)
RUN npm run build

# Remover devDependencies após compilação para reduzir tamanho da imagem
RUN npm prune --production

# Ajustar permissões do diretório para o usuário pwuser
RUN chown -R pwuser:pwuser /app

# Mudar para usuário não-root (já existe na imagem base)
USER pwuser

# Expor porta se necessário (para futuro uso com servidor)
EXPOSE 3000

# Comando padrão
CMD ["node", "dist/cli/index.js"]

