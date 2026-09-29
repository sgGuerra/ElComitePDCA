# ============================================
# Dockerfile para Frontend - React/Vite
# Multi-stage build: Node → Nginx
# ============================================

# ---- Stage 1: Builder ----
FROM node:20-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente del frontend
COPY . .

# Variable de entorno para la URL del backend
# Se inyecta en build time (Vite la embebe en el JS compilado)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Construir la aplicación para producción
RUN npm run build

# ---- Stage 2: Production (Nginx) ----
FROM nginx:alpine

# Copiar los archivos compilados al directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Puerto del servidor web
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
