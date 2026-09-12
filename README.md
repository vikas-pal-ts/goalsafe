# GoalSafe

> **AI-powered financial affordability and goal decision assistant.**

GoalSafe helps you make confident financial decisions by looking beyond your current balance — forecasting your commitments, goals, and safety buffer before you spend.

---

## Architecture

```
React / Next.js frontend
        ↓
  FastAPI backend
        ↓
 Deterministic financial engine
        ↓
    Scenario analysis
        ↓
 Goal-aware recommendation
```

> ⚠️ **Important**: The deterministic financial engine is authoritative for financial calculations. AI is used only for interpretation, personalization, and explanation. AI never performs financial arithmetic.

---

## Repository Structure

```
goalsafe/
├── frontend/      # Next.js + React + TypeScript + Tailwind CSS
├── backend/       # FastAPI + Python + Pydantic v2
├── README.md
└── .gitignore
```

---

## Quick Start

### Backend

```bash
cd goalsafe/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd goalsafe/frontend
npm install
npm run dev
```

Then open: http://localhost:3000

---

## API

- `GET  /api/health` — Health check
- `POST /api/analyze` — Analyze a financial request

---

## Design Principles

- **Safety first**: Recommendations never compromise the user's minimum balance
- **Transparency**: Every decision is backed by deterministic facts, not AI guesswork
- **Composability**: The demo engine can be swapped for the real deterministic solver without UI changes
