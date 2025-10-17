# Stage 1: Build the application
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# O 'ng build' irá gerar a saída no diretório /app/dist/timesheet-valeshop
RUN npm run build

# Stage 2: Serve the application from a lightweight server
FROM node:20-slim
WORKDIR /app

# Copia os artefatos de build da stage anterior
COPY --from=build /app/dist/timesheet-valeshop/ ./dist/timesheet-valeshop/

# Copia package.json/lock e instala apenas as dependências de produção
COPY --from=build /app/package*.json ./
RUN npm install --omit=dev

# Expõe a porta que o app vai rodar
EXPOSE 4000

# Define a variável de ambiente da porta
ENV PORT=4000

# Comando para iniciar o servidor SSR
CMD ["node", "dist/timesheet-valeshop/server/server.mjs"]
