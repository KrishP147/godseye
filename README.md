# GodsEye

A multi-agent simulation that pits AI forecaster personas against live Polymarket markets and flags bets that may be mispriced.

2nd place out of 212 teams in the Polymarket-sponsored Prediction Markets track at YHack 2026 (648 participants).

[Devpost](https://devpost.com/software/godseye-uwma5h) · [Demo video](https://www.youtube.com/watch?v=scFPqslbpVo) · [Project write-up](https://www.krishpunjabi.com/projects/godseye)

<div align="center">
  <a href="https://www.youtube.com/watch?v=scFPqslbpVo" target="_blank">
    <img src="https://img.youtube.com/vi/scFPqslbpVo/maxresdefault.jpg" alt="GodsEye demo video" width="560">
  </a>
  <p><em>Click to watch the demo</em></p>
</div>

## What it does

A market price tells you what traders think but not why. GodsEye takes a live Polymarket question, builds a small society of forecasters with different reasoning styles, lets them argue over the same evidence and shows where their consensus lands compared to the market.

- Browse live Polymarket events on a 3D globe or paste a market URL
- Generate a pool of claims and evidence for and against the outcome
- Build 12 forecaster personas across 6 styles (Bayesian updater, trend follower, contrarian, data skeptic, narrative focused, quantitative analyst), grounded in real professional profiles from Apollo where available
- Run a 30-tick simulation where agents update beliefs, share claims and adjust trust in each other
- Replay the run tick by tick with a debate feed, belief chart and trust network
- Read a report comparing the market probability with the simulated one, and paper trade against it

## How it works

```text
Polymarket URL or globe pick
        │
        ▼
 Market import ──► Claims generator ──► World builder ──► Simulation runner ──► Report agent
 (Gamma API)        (Gemini)            (Apollo + K2)     (30 ticks, Gemini)    (K2 + Gemini)
        │                                                        │                    │
        └──────────────── PostgreSQL / Supabase ◄─────────────────┴────────────────────┘
                                   │
                                   ▼
                 Next.js frontend: globe, replay, debate feed, trust network, report
```

1. The backend pulls market metadata and the current price from Polymarket's Gamma API.
2. An LLM writes a shared pool of claims with evidence on both sides.
3. The world builder creates 12 agents, each with a persona, a starting belief and trust scores toward the others.
4. Each tick, every agent sees a slice of the claims plus anything other agents shared with it, then either updates its belief or shares a claim. Trust and factions update as the run goes.
5. A report agent plans, drafts and self-critiques a write-up of the run, including the gap between the simulated probability and the market.
6. The frontend replays the run and renders the report. Supabase realtime pushes updates when configured.

## Stack

**Frontend:** Next.js 16, React 19, TypeScript, Three.js with React Three Fiber, TanStack Query, D3 and Recharts, Tailwind CSS, Supabase realtime

**Backend:** Python 3.12, FastAPI, async SQLAlchemy with asyncpg, PostgreSQL on Supabase, httpx, LiteLLM

**Models and data:** K2 Think and Gemini for reasoning and generation, Apollo for persona profiles (Gemini and Apollo through the Lava gateway), Polymarket Gamma API for markets

## Run it locally

You need Node.js (current LTS), Python 3.12 and a PostgreSQL database (a free Supabase project works). The schema is in `shared_contracts/supabase_schema.sql`.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in DATABASE_URL, LAVA_API_KEY and K2_API_KEY
uvicorn app.main:app --reload --port 5001
```

The API runs at `http://localhost:5001`. Check it with `GET /healthz`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # NEXT_PUBLIC_API_URL defaults to http://localhost:5001
npm run dev
```

Open `http://localhost:3000`. To see the replay and report screens without a backend, open `/simulation/mock` or `/reports/mock`. Supabase keys are optional on the frontend; without them realtime is off and pages fall back to polling.

### Tests

```bash
cd backend
python -m pytest
```

Some route and integration tests need a database and live API keys and will fail or error without them. `integration_test_full.py` and `smoke_test_llm.py` in `backend/` run the full pipeline and the LLM calls against real services.

## Main API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/healthz` | Health check |
| GET | `/api/markets/browse` | Live Polymarket events (cached for an hour) |
| POST | `/api/markets/refresh` | Refresh the browse cache |
| POST | `/api/markets/import` | Import a market from a Polymarket URL |
| POST | `/api/sessions/{market_id}/claims/generate` | Generate claims |
| POST | `/api/simulations/build-world` | Create a simulation and its agents |
| POST | `/api/simulations/{id}/start` | Run the simulation in the background |
| GET | `/api/simulations/{id}` | Simulation state and tick data |
| GET | `/api/reports/{simulation_id}` | Final report |

## Project structure

```text
backend/
  app/
    api/routes/     FastAPI routes (markets, claims, simulations, reports, paper trading)
    core/           config, database and the LLM client
    models/         SQLAlchemy models
    schemas/        Pydantic request and response models
    services/       Polymarket client, claims generator, Apollo personas, world builder,
                    simulation runner, report agent
    workers/        background pipeline that ties the services together
  tests/
frontend/
  app/              pages: globe home, simulation replay, report
  components/       globe, replay, debate feed, trust network, belief chart, paper trading
  lib/              API client, types, Supabase client, mock data
shared_contracts/   database schema
docs/planning/      design docs written before and during the hackathon
```

The docs in `docs/planning/` were the team's plan going in. The code changed during the build, so treat them as background rather than a spec.

## Limitations

- This is a hackathon project built over one weekend. It has not been hardened for production.
- Nothing has been backtested. The gap between the simulated and market probability is a prompt for a closer look, not evidence of a mispricing or a trading signal.
- Results depend on the LLMs and prompts and will vary between runs.
- Paper trading is simulated. Orders are signed with a Phantom wallet to tie them to an address, but no funds move and nothing reaches Polymarket.
- Running a simulation makes many LLM calls and needs your own API keys.

## Team

Built at YHack 2026 by [Sunny Wu](https://github.com/sxnnywu), [Kevin Wang](https://github.com/k3vinwvng), [Hamza Ammar](https://github.com/hamzakammar) and [Krish Punjabi](https://github.com/KrishP147).

Krish led the frontend (the 3D globe, simulation replay, debate feed and trust network visualization) and wrote about 55% of the code. The original team repo is [sxnnywu/godseye](https://github.com/sxnnywu/godseye); this is Krish's fork.
