# -------------------------------------------------------------
# Etapa 1: Compilar Frontend React + Vite
# -------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app

COPY package*.json ./
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# -------------------------------------------------------------
# Etapa 2: Aplicación Final Backend FastAPI + Frontend estático
# -------------------------------------------------------------
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_DIST=/app/frontend/dist
ENV DATABASE_URL=sqlite:///../database.sqlite

WORKDIR /app

# Instalar dependencias del backend
COPY backend/requirements.txt ./backend/requirements.txt
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r ./backend/requirements.txt

# Crear usuario sin privilegios
RUN useradd --create-home --uid 10001 appuser

# Copiar backend
COPY --chown=appuser:appuser backend ./backend

# Copiar el frontend compilado desde la etapa 1
COPY --from=frontend-builder --chown=appuser:appuser /app/frontend/dist /app/frontend/dist

# Asegurar directorios y permisos
RUN mkdir -p /app/backend/app/uploads && touch /app/database.sqlite && chown -R appuser:appuser /app

USER appuser

WORKDIR /app/backend

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')"

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
