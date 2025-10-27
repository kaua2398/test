# ============================
# STAGE 1 — Build Angular app
# ============================
FROM node:20 AS build

WORKDIR /app

# Copia arquivos de configuração e instala dependências
COPY package*.json ./
RUN npm install -g @angular/cli && npm install

# Copia o restante do projeto
COPY . .

# Gera o build de produção
RUN npm run build

# ============================
# STAGE 2 — Node para servir (sem SSR)
# ============================
FROM node:20-slim AS production

WORKDIR /app

# Copia o build gerado
COPY --from=build /app/dist/timesheet-valeshop/browser ./dist/timesheet-valeshop/browser
COPY --from=build /app/package*.json ./

# Instala apenas dependências essenciais
RUN npm install --omit=dev

# Exponha a porta do Angular dev server (pode ser 4200)
EXPOSE 4200

# Variável de ambiente
ENV PORT=4200
ENV HOST=0.0.0.0

# Para ambiente DEV: usa o ng serve
CMD ["npm", "run", "dev"]
