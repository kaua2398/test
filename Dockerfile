# ============================
# STAGE 1 — Build Angular
# ============================
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install -g @angular/cli && npm install
COPY . .
RUN ng build --configuration production


# ============================
# STAGE 2 — Servir com NGINX
# ============================
FROM nginx:stable-alpine AS production

# Copia o build gerado
COPY --from=build /app/dist/timesheet-valeshop/browser /usr/share/nginx/html

# Copia as configurações do NGINX
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
