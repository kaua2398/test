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
# STAGE 2 — NGINX
# ============================
FROM nginx:stable-alpine AS production

# Copia build
COPY --from=build /app/dist/timesheet-valeshop/browser /usr/share/nginx/html

# Copia configs
COPY nginx.conf /etc/nginx/nginx.conf          # ✅ global
COPY default.conf /etc/nginx/conf.d/default.conf   # ✅ o teu antigo default_nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
