# ============================================
# Dockerfile para Backend - FastAPI
# Multi-stage build para optimizar tamaño
# ============================================

# ---- Stage 1: Builder ----
FROM python:3.10-slim AS builder

WORKDIR /build

# Copiar e instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=120 --retries=5 --prefix=/install -r requirements.txt

# ---- Stage 2: Production ----
FROM python:3.10-slim

WORKDIR /app

# Copiar dependencias instaladas desde el builder
COPY --from=builder /install /usr/local

# Copiar código de la aplicación
COPY . .

# Crear directorio de uploads y data
RUN mkdir -p app/uploads /data

# Puerto de la API
EXPOSE 8000

# Comando de inicio
CMD ["uvicorn", "asgi:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
