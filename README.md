# OPPARCH AI

**DISCOVER. ANALYZE. GROW.**

> AI-Powered Global Opportunity Discovery & Client Intelligence Platform for **DevArcher**

OPPARCH AI helps DevArcher discover real potential customers who need digital services — using free, open, and permitted public data sources. No paid APIs. No Google Places. No OpenAI subscription.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  OPPARCH AI                         │
│  ┌───────────────────┐  ┌───────────────────────┐   │
│  │  DEMO MODE         │  │  REAL FREE MODE        │   │
│  │  Synthetic dataset │  │  OpenStreetMap via     │   │
│  │  labeled DEMO DATA │  │  Overpass API (FREE)   │   │
│  └───────────────────┘  └───────────────────────┘   │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │
│  │ FastAPI      │  │ Next.js 14   │  │  SQLite  │   │
│  │ Backend      │  │ Frontend     │  │  DB      │   │
│  │ Python 3.11+ │  │ (TypeScript) │  │  (local) │   │
│  └──────────────┘  └──────────────┘  └──────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │  LOCAL AI (Ollama — optional, free)          │    │
│  │  Model: qwen2.5:3b / qwen2.5:7b / llama3    │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Features

| Feature | Status |
|---|---|
| 🌍 REAL FREE MODE — OpenStreetMap / Overpass API Discovery | ✅ |
| 🎭 DEMO MODE — Synthetic labeled dataset for demonstration | ✅ |
| 🤖 Local AI Analysis — Ollama (qwen2.5, llama3, mistral) | ✅ |
| 🛡 SSRF Protection on Website Auditor | ✅ |
| 📊 Opportunity Scoring Engine (0–100) | ✅ |
| 🎯 DevArcher Service Matcher | ✅ |
| 🔐 Authentication & Multi-User RBAC | ✅ |
| 👮 Admin Command Center | ✅ |
| 📋 CRM Pipeline (Kanban stages) | ✅ |
| 📤 CSV Exports with Data Mode tagging | ✅ |
| 🗺 Location Integrity (Islamabad→Pakistan, Delhi→India) | ✅ |

---

## Windows Setup Guide (Full Local)

### Prerequisites

| Tool | Version | Download |
|---|---|---|
| Python | 3.11 or 3.12 | python.org |
| Node.js | 18+ LTS | nodejs.org |
| Ollama (optional) | Latest | ollama.com/download |

---

### Step 1 — Clone / Extract the Project

```powershell
# Already extracted to a directory — navigate to it:
cd "c:\Users\hp\OneDrive\Desktop\opparch ai"
```

---

### Step 2 — Backend Setup (FastAPI)

```powershell
# Create and activate Python virtual environment
cd backend
python -m venv venv
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt
```

---

### Step 3 — Run the FastAPI Backend

```powershell
# From backend\ directory with venv activated:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
Interactive API Docs: `http://localhost:8000/docs`

---

### Step 4 — Frontend Setup (Next.js)

```powershell
# Open a new PowerShell window
cd "c:\Users\hp\OneDrive\Desktop\opparch ai\frontend"
npm install
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

### Step 5 — Set Up Local AI with Ollama (Optional but Recommended)

Real Free Mode business discovery works **without Ollama** — Ollama is only needed for richer natural language intent parsing.

```powershell
# 1. Download Ollama from: https://ollama.com/download
# 2. Start Ollama service:
ollama serve

# 3. Pull a free model (in a new terminal):
ollama pull qwen2.5:3b    # Recommended — fast, small
# OR
ollama pull qwen2.5:7b    # More capable
# OR
ollama pull llama3.2:3b   # Meta Llama 3

# 4. Verify Ollama is running:
curl http://localhost:11434/api/tags
```

Configure the model in your backend `.env` file:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

> **Note:** If Ollama is offline, Real Free Mode still discovers real businesses. Only the AI analysis step is gracefully skipped with a message: *"Local AI is offline. Real business discovery can still run, but AI analysis is unavailable."*

---

## Running Tests

```powershell
cd backend
venv\Scripts\activate
python -m pytest tests/ -v
```

Expected: **33 tests pass** covering:
- City-country integrity (Islamabad→Pakistan, Delhi→India, Dubai→UAE)
- REAL FREE MODE routing to Overpass API
- Zero-fabrication guarantee (empty Overpass result → empty response, no fake fallback)
- SSRF protection (localhost, 127.0.0.1, 10.x.x.x, 192.168.x.x all blocked)
- Overpass QL query structure for each industry category

---

## Using REAL FREE MODE

1. Open the app at `http://localhost:3000`
2. Navigate to **Opportunity Hunter** in the sidebar
3. Select **REAL FREE MODE** toggle (green button — top right of search panel)
4. Enter your search:
   - Country: `Pakistan`, City: `Islamabad`, Industry: `Restaurants`
   - Or type: *"Find restaurants in Islamabad that need professional websites"*
5. Click **HUNT OPPORTUNITIES**

OPPARCH AI will query OpenStreetMap via the Overpass API and return **real businesses** listed in OpenStreetMap for that city and category.

### Data Integrity Guarantees in REAL FREE MODE

| Rule | Enforcement |
|---|---|
| Never fabricates businesses | ✅ If Overpass returns 0 results → empty list + clear message |
| Never mixes real + demo data | ✅ Modes are strictly separated in backend router |
| Source transparency | ✅ Every lead shows "Source: OpenStreetMap / Overpass API" + OSM link |
| SSRF protection | ✅ Website auditor blocks private IPs and localhost |
| Location integrity | ✅ Islamabad always returns Pakistan dial code (+92) and Pakistan address |

### Example Real Mode Search Prompts

```
"Find restaurants in Islamabad that don't have professional websites"
"Find medical stores in Lahore with weak digital presence"
"Find hotels in Dubai that need SEO optimization"
"Find salons in London that need online booking systems"
"Find software companies in Karachi needing branding"
```

---

## DEMO MODE

- Uses a pre-loaded realistic dataset clearly labeled **DEMO DATA — FOR DEMONSTRATION ONLY**
- Useful for pitching the platform or testing without internet connectivity
- All demo records carry `is_demo_data: true` and `data_mode: "DEMO"` in the database
- Demo Mode **never** makes any external API calls

---

## Environment Variables

Create `backend/.env`:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./opparch_ai.db

# Security
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Local AI
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

---

## API Documentation

Once backend is running, visit `http://localhost:8000/docs` for full interactive Swagger UI.

Key endpoints:

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/search/discover` | POST | Execute opportunity discovery (DEMO or REAL_FREE) |
| `/api/v1/leads` | GET | List discovered business leads |
| `/api/v1/leads/{id}` | GET | Full lead detail with audit + score |
| `/api/v1/leads/{id}/verify` | POST | Re-verify lead website & contact |
| `/api/v1/crm/pipeline` | GET | CRM kanban pipeline |
| `/api/v1/export/csv` | POST | Generate CSV export (with Mode column) |
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/login` | POST | Login |
| `/api/v1/admin/dashboard` | GET | Admin statistics (admin only) |
| `/api/v1/settings/ollama-status` | GET | Check local Ollama health |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.11+, SQLAlchemy (async), aiosqlite |
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Database | SQLite (local dev), PostgreSQL-ready |
| Real Data Source | OpenStreetMap via Overpass API (free, ODbL license) |
| Local AI | Ollama (qwen2.5:3b / 7b, llama3, mistral) |
| Authentication | JWT + bcrypt (passlib) |
| Testing | pytest + pytest-asyncio |

---

## Data Sources & Attribution

**REAL FREE MODE** uses:
- **OpenStreetMap** — Open data, licensed under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/)
- **Overpass API** — Public API endpoint for querying OSM data (`overpass-api.de`)

Attribution: © OpenStreetMap Contributors

OPPARCH AI adheres to Overpass API usage policy:
- Targeted area queries only (no bulk planet dumps)
- Rate-limiting aware with mirror endpoint fallback
- Custom User-Agent header identifying the application

---

## Project Structure

```
opparch ai/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI route handlers
│   │   │   ├── search.py     # Opportunity discovery (DEMO + REAL_FREE)
│   │   │   ├── leads.py      # Lead intelligence
│   │   │   ├── crm.py        # CRM pipeline
│   │   │   ├── export.py     # CSV export with Mode column
│   │   │   ├── auth.py       # Authentication
│   │   │   └── admin.py      # Admin Command Center
│   │   ├── providers/
│   │   │   ├── search_provider.py           # Mode routing (DEMO/REAL_FREE)
│   │   │   ├── free_real_business_provider.py  # OpenStreetMap/Overpass
│   │   │   ├── ai_provider.py               # Intent parsing
│   │   │   └── ollama_provider.py           # Local Ollama LLM
│   │   ├── analyzers/
│   │   │   └── website_analyzer.py          # SSRF-protected auditor
│   │   ├── core/
│   │   │   ├── location_registry.py         # City-country integrity
│   │   │   └── security.py                  # JWT + RBAC
│   │   ├── database/
│   │   │   ├── models.py                    # ORM tables (with data_mode)
│   │   │   └── session.py                   # Async SQLAlchemy session
│   │   ├── scoring/
│   │   │   ├── scoring_engine.py            # 0-100 opportunity scoring
│   │   │   └── service_matcher.py           # DevArcher service matching
│   │   └── schemas/schemas.py               # Pydantic v2 schemas
│   ├── tests/
│   │   ├── test_real_free_mode.py           # 26 REAL FREE MODE tests
│   │   ├── test_location_integrity.py       # Location integrity tests
│   │   ├── test_scoring.py                  # Scoring engine tests
│   │   └── test_auth_and_isolation.py       # Auth + RBAC tests
│   ├── requirements.txt
│   └── pytest.ini
└── frontend/
    ├── app/
    │   ├── opportunity-hunter/page.tsx       # Main search + mode toggle
    │   ├── leads/[id]/page.tsx               # Lead detail
    │   ├── settings/page.tsx                 # Overpass + Ollama status
    │   ├── dashboard/page.tsx
    │   ├── admin/page.tsx
    │   └── ...
    ├── components/
    │   ├── Header.tsx
    │   └── Sidebar.tsx
    └── lib/
        ├── api.ts                            # Frontend API client
        └── auth-context.tsx                  # Auth state
```

---

## Founder

**Syed Zulqarnain Nasir** — Senior Software Architect & Full-Stack AI Engineer
DevArcher — *Straight to the target.*
Website: [devarcher.com](https://devarcher.com)

---

*OPPARCH AI — Find the Opportunities Behind the Data.*
