# AGENTS.md

Monorepo: FastAPI + SQLite backend (`backend/`) and React 19 + Vite frontend (`frontend/`). Package manager: npm workspaces at root; Python via `backend/.venv`.

## Commands

- Backend tests: `cd backend && .venv\Scripts\python.exe -m pytest` (CI runs `pytest --cov=app --cov-report=xml` from `backend/`)
- Backend serve: `cd backend && uvicorn app.main:app --reload --port 8000` (or `python run.py --reload`, default port 8000)
- Frontend tests: `cd frontend && npm run test` (watch off; `test:cov` adds coverage)
- Frontend lint: `cd frontend && npm run lint`
- Frontend serve: `cd frontend && npm run dev`; both servers: root `npm run dev`
- Single backend test: `pytest tests/test_security.py::TestSecurityEndpoints::test_login_rate_limiting -v`

## Test quirks

- `backend/tests/conftest.py` monkeypatches `app.db.database` to a shared in-memory SQLite (`file::memory:?cache=shared`) **before** importing the app, and keeps a persistent connection alive for the whole session — without it the in-memory DB is wiped. Do not close/replace that connection or import `app.main` before conftest's patch.
- Root `pytest.ini` sets `testpaths = backend/tests` and lists `backend/tests/api` under `norecursedirs`; check intended collection before running pytest from the repo root.
- Known pre-existing failure: `tests/test_security.py::TestSecurityEndpoints::test_pydantic_mass_payload_injection` currently fails.

## Architecture / gotchas

- App startup (`backend/app/main.py` lifespan) runs `init_db`, then executes `create_admin.py` and `seed_db.py` on **every** server start — imports of the FastAPI app have DB side effects; tests avoid this via the conftest monkeypatch.
- Auth: JWT via `SECRET_KEY`; a hardcoded fallback secret ships in `backend/app/core/config.py` (README's env table is advisory, not enforced).
- `DATABASE_URL` default is relative SQLite (`sqlite:///../database.sqlite`); docker-compose overrides to `sqlite:////data/database.sqlite`.
- Frontend talks to backend via `VITE_API_URL` (`frontend/.env`); default local `http://localhost:8000`.
- CI (`.github/workflows/build.yml`) targets branch `test/dev` on windows-latest: backend pytest with coverage -> frontend `npm run test:cov` -> SonarCloud. `Jenkinsfile` additionally builds/deploys via docker compose.
