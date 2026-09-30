# Multi-stage Dockerfile para construir la aplicación React (Vite) y servirla con Nginx
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración de dependencias
COPY package.json ./
COPY package-lock.json* ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

COPY . .

# Compilar SPA de producción
RUN npm run build

# Etapa 2: Servidor Nginx de producción ultraliviano
FROM nginx:alpine

# Copiar el build compilado de React (Vite) en la raíz web de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
