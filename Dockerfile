# ============================
# STAGE 1 — Build Angular app
# ============================
FROM node:20 AS build

WORKDIR /app
COPY package*.json ./
RUN npm install -g @angular/cli && npm install
COPY . .
RUN npm run build

# ============================
# STAGE 2 — Servir com ng serve (DEV MODE)
# ============================
FROM node:20-slim AS dev

WORKDIR /app

# Copia o projeto completo (não só o build, pois ng serve precisa do código-fonte)
COPY . .

# Instala Angular CLI e dependências
RUN npm install -g @angular/cli && npm install

# Expõe a porta
EXPOSE 4200
ENV PORT=4200
ENV HOST=0.0.0.0

# Comando padrão
CMD ["npm", "run", "dev"]
