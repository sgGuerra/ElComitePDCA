# 🔄 Sistema de Mejoramiento Continuo (El Comité PDCA)

Solución de software modular y responsiva para la gestión del ciclo PDCA (Plan, Do, Check, Act) y el programa de mejoramiento continuo de **El Comité**.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/ImKrav/ElComitePDCA?quickstart=1)

---

## 🛠️ Tecnologías Utilizadas

- **Backend**: Python 3.10+ (probado y compatible con Python 3.13), FastAPI, Uvicorn, SQLite (`aiosqlite`), Pydantic.
- **Frontend**: React 19, Vite, Tailwind CSS, React Router, Recharts, Axios.

---

## 📋 Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados en tu sistema:

- **Node.js**: `>= 18.x`
- **Python**: `>= 3.10` (compatible con Python 3.13)
- **npm**: Administrador de paquetes de Node.js
- **pip**: Administrador de paquetes de Python

---

## 📁 Estructura del Proyecto

```text
ElComitePDCA/
├── backend/               # Servidor API FastAPI
│   ├── app/               # Lógica de la aplicación (rutas, modelos, esquemas)
│   ├── create_admin.py    # Script para crear/actualizar usuario administrador
│   ├── run.py             # Script ejecutor del servidor de desarrollo
│   ├── requirements.txt   # Dependencias de Python
│   └── database.sqlite    # Base de datos SQLite
├── frontend/              # Aplicación cliente React + Vite
│   ├── src/               # Componentes, páginas y servicios React
│   ├── public/            # Archivos estáticos
│   ├── package.json       # Dependencias de Node.js
│   └── vite.config.js     # Configuración de Vite
├── package.json           # Configuración raíz para ejecución conjunta
└── README.md              # Documentación del proyecto
```

---

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd ElComitePDCA
```

---

### 2. Configurar el Backend (FastAPI)

Navega a la carpeta `backend` e inicializa el entorno virtual de Python:

```bash
cd backend
```

#### Crear y activar el entorno virtual (`.venv`):

- **En Windows (PowerShell):**
  ```powershell
  python -m venv .venv
  .\.venv\Scripts\Activate.ps1
  ```

- **En Linux / macOS:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

#### Instalar dependencias:
```bash
pip install -r requirements.txt
```

#### Variables de entorno (`.env`):
Crea o edita el archivo `.env` en la carpeta `backend/` si deseas ajustar las claves secretas (opcional para desarrollo local):
```env
SECRET_KEY=tu-clave-secreta-super-segura
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

#### Crear/Actualizar usuario Administrador por defecto:
Ejecuta el script para generar el usuario administrador inicial en la base de datos:
```bash
python create_admin.py
```
> **Credenciales por defecto generadas:**
> - **Email**: `admin@elcomite.org` (o `miguel@elcomite.org`)
> - **Contraseña**: `Admin123!`

#### Iniciar el servidor Backend:

- **Opción A: Usando el servidor uvicorn (Puerto 8000 por defecto)**
  ```bash
  uvicorn app.main:app --reload --port 8000
  ```

- **Opción B: Usando el runner `run.py` (Puerto 5000 por defecto)**
  ```bash
  python run.py --reload
  ```

El backend estará disponible en:
- **API Base**: `http://localhost:8000` (o `http://localhost:5000`)
- **Documentación Swagger**: `http://localhost:8000/docs`

---

### 3. Configurar el Frontend (React + Vite)

En una nueva terminal, navega a la carpeta `frontend`:

```bash
cd frontend
```

#### Instalar dependencias de Node.js:
```bash
npm install
```

#### Variables de entorno (`.env`):
Verifica o crea el archivo `.env` dentro de `frontend/` para indicar la URL de la API:
```env
VITE_API_URL=http://localhost:8000
```
*(Asegúrate de que el puerto coincida con el puerto donde esté ejecutándose el backend).*

#### Iniciar el servidor de desarrollo Frontend:
```bash
npm run dev
```

El cliente web estará disponible en `http://localhost:5173`.

---

## ⚡ Ejecución Simultánea (Backend + Frontend)

Si instalaste las dependencias en la raíz del proyecto, puedes iniciar ambos servicios simultáneamente con un solo comando:

```bash
# Desde la raíz del proyecto /ElComitePDCA
npm install
npm run dev
```

---

## ⚙️ Variables de Entorno

### Backend (`backend/.env`)
| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `SECRET_KEY` | Clave secreta para firmar tokens JWT | *Generado aleatoriamente* |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token de acceso (en minutos) | `1440` (24 horas) |
| `DATABASE_URL` | URI de conexión a la base de datos | `sqlite:///../database.sqlite` |

### Frontend (`frontend/.env`)
| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API del Backend | `http://localhost:8000` |

---

## 📚 Documentación de la API

Una vez iniciado el backend, FastAPI genera automáticamente la documentación interactiva:

- 📖 **Swagger UI**: `http://localhost:8000/docs`
- 📑 **ReDoc**: `http://localhost:8000/redoc`

---

## 💡 Comandos Útiles

| Acción | Comando |
| --- | --- |
| Iniciar Backend (uvicorn) | `cd backend && uvicorn app.main:app --reload --port 8000` |
| Iniciar Backend (run.py) | `cd backend && python run.py --reload` |
| Iniciar Frontend | `cd frontend && npm run dev` |
| Crear Admin | `cd backend && python create_admin.py` |
| Build Frontend (Producción) | `cd frontend && npm run build` |
| Preview Build Frontend | `cd frontend && npm run preview` |
| Ejecutar Tests | `cd backend && pytest` |

## Ejecucción de pruebas

En Windows Power Shell:
```bash
cd backend
.venv\Scripts\python.exe -m pytest tests/ -v
```
En Linux:
```bash
cd backend
python3 -m pytest tests/ -v
```

---

## 📝 Notas y Recomendaciones

- Asegúrate de que el backend esté en ejecución antes de interactuar con el frontend para evitar errores de conexión API.
- Si cambias el puerto del backend (por ejemplo de `8000` a `5000`), actualiza la variable `VITE_API_URL` en `frontend/.env`.
