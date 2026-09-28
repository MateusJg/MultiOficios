FROM node:22-alpine

WORKDIR /app

# Instalar dependencias
COPY package.json ./
RUN npm install

# Copiar código fuente
COPY tsconfig.json ./
COPY src ./src

# Directorio de persistencia
RUN mkdir -p /app/datos

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
