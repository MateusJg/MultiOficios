# Multi-stage Dockerfile para construir la aplicación React (Vite) de IA Studio y servirla con Nginx
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar configuración de dependencias
COPY package.json ./
COPY package-lock.json* ./

# Instalar dependencias tolerando flags de resolución
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Etapa 2: Servidor Nginx de producción ultraliviano
FROM nginx:alpine

# Copiar el build compilado de React (Vite) en la raíz web de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
