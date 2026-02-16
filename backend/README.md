# Backend (Lambda)

Minimal Python Lambda handler placeholder.

Planned layout:
- `src/app.py` Lambda handler
- `requirements.txt` Python deps (placeholder)
- `build.sh` to create minimal deployment zip (only `src/app.py`)

Notes:
- Keep Lambda runtime in `infra/variables.tf` aligned with the Python version used in CI.

## Local dev (FastAPI)

This repo deploys the backend as Lambda + API Gateway, but you can run a local HTTP server for development:

- Install dev deps: `uv sync --dev`
- Run server: `python3 -m uvicorn backend.dev_server:app --reload --port 8000`

Then set `window.__API_URL__ = 'http://localhost:8000'` in `frontend/src/index.html` (or in devtools) and reload.
