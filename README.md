# Sistema de mejoramiento continuo

Solución de software al programa de mejoramiento continuo de El Comité.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ImKrav/ElComitePDCA?quickstart=1)

---

## Requisitos

- Node.js >= 18.x
- Python 3.11 o 3.10 (no usar 3.13)
- pip

---

## Instalación y ejecución

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd ElComitePDCA
```

### 2. Backend (FastAPI)

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Configura tu archivo .env si es necesario (ver ejemplo .env.example)
# Inicializa la base de datos (se crea automáticamente al iniciar el backend)
uvicorn app.main:app --reload
```

Por defecto, el backend corre en http://localhost:8000

### 3. Frontend (React)

```bash
cd ../frontend
npm install
npm run dev
```

Por defecto, el frontend corre en http://localhost:5173

---

## Variables de entorno

- El frontend usa la variable `VITE_API_URL` en un archivo `.env` para apuntar al backend:
  ```env
  VITE_API_URL=http://localhost:8000/api
  ```
- El backend puede requerir un archivo `.env` para la configuración de la base de datos y la clave secreta.

---

## Notas
- Asegúrate de que el backend esté corriendo antes de usar el frontend.
- Si tienes problemas con dependencias de Python, revisa que estés usando la versión recomendada.
- Si cambias el puerto del backend, actualiza la variable `VITE_API_URL` en el frontend.

---

## Comandos útiles

- Iniciar backend:
  ```bash
  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
  ```
- Iniciar frontend:
  ```bash
  cd frontend && npm run dev
  ```
