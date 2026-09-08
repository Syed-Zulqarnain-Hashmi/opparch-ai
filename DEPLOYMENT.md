# OPPARCH AI — Production Deployment Guide

This guide provides step-by-step instructions for deploying **OPPARCH AI** in a high-availability, production-grade cloud setup:

- **Frontend:** Next.js deployed on **Vercel** (`https://opparch-ai.vercel.app`)
- **Backend:** FastAPI (Python 3.10+) deployed on **Render**
- **Database:** Managed PostgreSQL (Render PostgreSQL or Neon / Supabase)
- **AI Providers:** Cloud AI (Gemini 1.5 Pro / Flash, OpenAI GPT-4o) + Optional Local Ollama (`qwen3:4b`, `qwen2.5:3b`)
- **Email Outreach:** Zoho SMTP (`smtp.zoho.com` / TLS 587)

---

## 1. Architecture Overview

```
                               ┌────────────────────────────────┐
                               │       User / Web Browser       │
                               └───────────────┬────────────────┘
                                               │
                                               ▼
                               ┌────────────────────────────────┐
                               │        Vercel (Frontend)       │
                               │  https://opparch-ai.vercel.app │
                               │          (Next.js 14)          │
                               └───────────────┬────────────────┘
                                               │ HTTPS API Calls
                                               ▼
                               ┌────────────────────────────────┐
                               │         Render (Backend)       │
                               │   https://<your-app>.onrender.com
                               │        (FastAPI + Uvicorn)     │
                               └───┬───────────┬────────────┬───┘
                                   │           │            │
                     ┌─────────────┘           │            └──────────────┐
                     ▼                         ▼                           ▼
          ┌─────────────────────┐   ┌─────────────────────┐    ┌─────────────────────┐
          │  Render PostgreSQL  │   │ Cloud AI Providers  │    │      Zoho SMTP      │
          │ (Asyncpg Pool 5-10) │   │  • Google Gemini    │    │   smtp.zoho.com:587 │
          │                     │   │  • OpenAI GPT-4o    │    │  Outreach & Deals   │
          └─────────────────────┘   └─────────────────────┘    └─────────────────────┘
```

---

## 2. Render Deployment (FastAPI Backend)

### Step 2.1 — Create New Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `Syed-Zulqarnain-Hashmi/opparch-ai`.
4. Configure the service settings:
   - **Name:** `opparch-ai-backend` (or your preferred name)
   - **Region:** Choose the region closest to your users (e.g., Frankfurt or Oregon)
   - **Branch:** `main`
   - **Root Directory:** `backend` *(CRITICAL: must be set to `backend`)*
   - **Runtime:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Plan:** Free (or Starter for 0s cold start)

---

### Step 2.2 — Render PostgreSQL Database Setup
1. On Render, click **New +** → **PostgreSQL**.
2. Set **Name:** `opparch-ai-db`.
3. Set **Database:** `opparch_db`.
4. Set **User:** `opparch_user`.
5. Once created, copy the **Internal Database URL** (if backend is in same Render region) or **External Database URL**.
   > **Note:** Render URLs typically begin with `postgres://` or `postgresql://`. The OPPARCH AI backend automatically normalizes this to `postgresql+asyncpg://` without any manual string editing required.

---

### Step 2.3 — Backend Environment Variables on Render
Under **Environment Variables** in your Render Web Service settings, add the following:

| Variable | Recommended Production Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@host:5432/db` *(or paste Render's `postgres://` URL)* | Async PostgreSQL connection string |
| `SECRET_KEY` | *(Generate a 64-char random hex string)* | JWT signing secret |
| `DEMO_MODE` | `false` | Disables demo mocks; enforces real autonomous engines |
| `CORS_ORIGINS` | `https://opparch-ai.vercel.app` | Comma-separated allowed web origins |
| `GEMINI_API_KEY` | `AIzaSy...` | Server-level Google Gemini fallback key |
| `OPENAI_API_KEY` | `sk-...` | Server-level OpenAI fallback key |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Local Ollama endpoint (if reverse-proxied / tunneled) |
| `SMTP_HOST` | `smtp.zoho.com` | Zoho SMTP server |
| `SMTP_PORT` | `587` | Zoho SMTP TLS port |
| `SMTP_USERNAME` | `contact@devarcher.com` | Zoho sending email |
| `SMTP_PASSWORD` | `<your-zoho-app-password>` | Zoho App-specific password |
| `SMTP_FROM` | `contact@devarcher.com` | Sender address |
| `SMTP_USE_TLS` | `true` | Enforce STARTTLS |
| `IMAP_HOST` | `imap.zoho.com` | Zoho IMAP server for inbox reply detection |
| `IMAP_PORT` | `993` | Zoho IMAP SSL port |

---

## 3. Vercel Deployment (Next.js Frontend)

The frontend is already deployed at [https://opparch-ai.vercel.app](https://opparch-ai.vercel.app/).

To link it to your live Render backend:

1. Open your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings** → **Environment Variables**.
3. Add or update:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://<your-render-app-name>.onrender.com`
   *(Do NOT add `/api/v1` or a trailing slash — the frontend `getApiBaseUrl()` utility automatically appends `/api/v1` if omitted).*
4. Navigate to **Deployments** and click **Redeploy** on the latest deployment to apply the new environment variable.

---

## 4. Verification & Health Checks

### 4.1 Backend Health Check
Verify your backend is alive by visiting or curling the public health endpoint:
```bash
curl https://<your-render-app-name>.onrender.com/health
```
**Expected response (HTTP 200):**
```json
{
  "status": "ok"
}
```

### 4.2 Interactive API Documentation
Swagger UI is available at:
```
https://<your-render-app-name>.onrender.com/docs
```

### 4.3 Full End-to-End Verification Test
You can run the full 13-stage automated production verification suite against any environment:
```bash
cd backend
python test_production_e2e.py
```
This tests:
1. Database table migrations
2. Health check (`/health`)
3. Root info endpoint
4. CORS headers for `https://opparch-ai.vercel.app`
5. User registration
6. User authentication & Bearer token generation
7. Profile retrieval (`/auth/me`)
8. Real lead retrieval and stats calculation
9. CRM 10-stage pipeline integrity
10. Website Auditor live technical analysis
11. AI Provider settings & key validation (Gemini / OpenAI)
12. System & Outreach configuration security (no leaked secrets)
13. Opportunity hunter project querying

---

## 5. AI Provider Configuration

### Cloud Providers (Recommended for Render)
- **Google Gemini:** Add `GEMINI_API_KEY` to Render environment variables. Users can also configure their own personal Gemini key in the frontend Settings page (`/settings`).
- **OpenAI:** Add `OPENAI_API_KEY` to Render environment variables, or allow users to input their own API key in `/settings`.
- **Strict Fallback Guarantee:** When Gemini or OpenAI is selected, the system will **never** silently fall back to an offline local model or generate synthetic data. If keys are missing, clear actionable diagnostics are returned.

### Local Ollama Integration
If you wish to use local Ollama models (`qwen3:4b`, `qwen2.5:3b`) running on your local machine:
1. Ensure Ollama is running locally: `ollama serve`.
2. Run the diagnostic connector helper:
   ```bash
   cd backend
   python local_ollama_connector.py
   ```
3. To expose local Ollama to your Render backend, run a secure tunnel:
   ```bash
   ngrok http 11434
   # or: cloudflared tunnel --url http://localhost:11434
   ```
4. Set `OLLAMA_BASE_URL` on Render to your tunnel URL (e.g. `https://xxxx.ngrok-free.app`).

---

## 6. Local Development Quickstart

### Backend
```bash
cd backend
# Create virtual environment if needed
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run server (SQLite by default)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:3000
```

---

## 7. Troubleshooting & FAQ

#### Q: Render Free Tier Cold Starts
**Symptom:** The first request after 15 minutes of inactivity takes 30–50 seconds.  
**Solution:** This is normal for Render Free instances. You can set up a free 5-minute health-ping monitor (e.g., UptimeRobot or Cron-job.org) targeting `https://<your-app>.onrender.com/health` to keep the backend warm.

#### Q: CORS errors in the browser console
**Symptom:** `Access-Control-Allow-Origin` missing on API calls.  
**Solution:** Ensure `CORS_ORIGINS` on Render contains your exact frontend origin (e.g. `https://opparch-ai.vercel.app`). The backend automatically allows all Vercel preview URLs via regex (`opparch-ai-*.vercel.app`).

#### Q: Database Connection Refused / SSL errors
**Symptom:** `asyncpg.exceptions.InvalidCatalogNameError` or SSL errors.  
**Solution:** Render PostgreSQL requires SSL. Ensure your `DATABASE_URL` has `?ssl=require` if using external connections outside of Render's private network.
