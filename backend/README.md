# GoalSafe Backend
> FastAPI service — financial analysis engine for the GoalSafe product.

## Quick Start
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints
- `GET  /api/health`
- `POST /api/analyze`

## Architecture
- `app/api/routes/` — HTTP endpoints
- `app/models/` — Pydantic request/response models
- `app/services/demo_engine.py` — **DEMO ONLY** deterministic mock responses
- `app/services/engine.py` — Abstract `FinancialDecisionEngine` interface (ready for real solver)
