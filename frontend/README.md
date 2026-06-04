# SkinAI

**AI-powered facial skin analysis web app** — real-time scanning, personalized reports, and a subscription paywall built end-to-end as a solo full-stack project.

🔗 **Live:** [skin-ai-two.vercel.app](https://skin-ai-two.vercel.app)

---

## What It Does

SkinAI uses computer vision and a large language model to analyze facial skin in real time through a webcam. Users get a structured health report covering skin tone (Fitzpatrick scale), hydration, clarity, texture, affected zones, and personalized product recommendations — all calibrated for darker skin tones that most consumer skincare tools ignore.

The deep analysis feature generates a full clinical-style breakdown across six categories: skin assessment, nutrition, skincare routine, lifestyle factors, weekly progress tracking, and a prioritized action plan. Deep analysis is gated behind a Stripe subscription after two free trials.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), Uvicorn |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Auth | Supabase Auth (JWT) |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe (subscription billing + webhooks) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |
| Storage | Railway Volume (saved frames) |

---

## Features

- **Real-time webcam scan** — captures a frame and sends it to the backend for AI analysis
- **Structured skin report** — Fitzpatrick tone classification, affected zone table, severity rating, and top 3 recommendations
- **Quantified scores** — moisture, clarity, evenness, and overall skin health displayed as animated circular progress rings
- **Deep Analysis** — 6-section clinical breakdown with expandable detail sections per category
- **Concern-focused scans** — users can target specific concerns (oiliness, acne, glow, protection) for weighted analysis
- **Scan history** — all reports saved per user, viewable and deletable from the History tab
- **Paywall** — 2 free deep analyses, then Stripe checkout for $4.99/month unlimited access
- **Profile page** — editable display name, plan status, total scan count, notifications toggle
- **Bottom navigation** — mobile-style tab bar (Home, Capture, Analysis, History)
- **Animated empty states** — custom SVG face illustration with scan bracket animation on the Analysis tab

---

## Architecture

```
Browser (React)
    │
    ├── Supabase Auth  ──────────────────── JWT token on every request
    │
    └── FastAPI (Railway)
            │
            ├── /analyze         POST  ── Claude Haiku vision → report + scores
            ├── /analyze/deep    POST  ── Claude Haiku vision → structured JSON report
            ├── /history         GET   ── fetch user's saved reports
            ├── /history/:id     DELETE── delete a report
            ├── /profile         GET   ── subscription status + trial count
            ├── /create-checkout-session POST ── Stripe checkout
            └── /webhook         POST  ── Stripe subscription events
                    │
                    └── Supabase DB
                            ├── profiles  (user_id, deep_analysis_count, is_subscribed, stripe_customer_id)
                            └── reports   (user_id, analysis, scores, frame_path, created_at)
```

---

## Local Development

**Prerequisites:** Node.js, Python 3.10+, a Supabase project, an Anthropic API key

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

```bash
uvicorn main:app --reload
# Backend runs on http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

```bash
npm start
# Frontend runs on http://localhost:3000
```

---

## Database Schema

### `profiles`
| Column | Type | Description |
|---|---|---|
| id | uuid | Matches Supabase auth user ID |
| email | text | User email |
| deep_analysis_count | int4 | Number of deep analyses used |
| is_subscribed | bool | Active Stripe subscription |
| stripe_customer_id | text | Stripe customer reference |
| subscription_end_date | text | ISO date of subscription expiry |

### `reports`
| Column | Type | Description |
|---|---|---|
| id | uuid | Auto-generated report ID |
| user_id | uuid | Foreign key to profiles |
| analysis | text | Full markdown analysis from Claude |
| scores | jsonb | skin_health, moisture, clarity, evenness, severity |
| frame_path | text | Path to saved webcam frame |
| created_at | timestamptz | Scan timestamp |

---

## Deployment

**Frontend (Vercel)**
- Push to `main` → auto-deploy
- Environment variables: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `CI=false`

**Backend (Railway)**
- Connected to GitHub repo, auto-deploys on push
- Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`
- Volume mounted at `RAILWAY_VOLUME_MOUNT_PATH` for frame storage

---

## Engineering Challenges

These are real obstacles encountered during development — not sanitized for a portfolio, but documented as they actually happened.

**Supabase RLS blocking backend inserts** — Row Level Security was enabled by default on the `profiles` and `reports` tables. The backend uses the service role key which should bypass RLS, but inserts were still failing. Fixed by explicitly disabling RLS on both tables since authentication is handled at the FastAPI layer via JWT verification.

**Railway deployment failing on `dotenv` import** — Production environment doesn't have `python-dotenv` installed the same way as local. Fixed by wrapping the import in a try/except so the app starts cleanly whether or not the package is present.

**CI=true treating React warnings as hard errors** — Vercel sets `CI=true` in its build environment, which causes Create React App to treat ESLint warnings as build-breaking errors. Fixed by adding `CI=false` as a Vercel environment variable.

**Pydantic 422 on null concern field** — The `concern` field in the `ImagePayload` model is typed as `Optional[str]`, but when the frontend sent `concern: null` explicitly in the JSON body, Pydantic rejected it with a 422 Unprocessable Content error. Fixed by using spread syntax in the fetch call to omit the field entirely when it has no value.

**Score anchoring to ~70%** — Claude defaults to middle-of-the-range scores regardless of actual skin condition because it lacks a calibrated reference distribution. Partially addressed with a detailed rubric in the scoring prompt. Full fix deferred to Stage 2 ML — a trained regression model on labeled skin condition data.

**Deep analysis JSON parsing** — Claude occasionally wraps JSON responses in markdown code fences despite explicit instructions not to. Backend strips leading ` ```json ` fences before parsing, with a comprehensive fallback response object if parsing still fails.

**Emoji contamination in section titles** — Claude's responses included emoji characters in section headers despite the structured JSON prompt. Fixed with a recursive `clean_deep_data()` function in the backend that strips all Unicode emoji ranges from string values before returning the response.

---

## Research Extension

This project is the foundation for Stage 2 ML research being conducted as part of a **2026 SURI Fellowship** at Bowie State University. The saved webcam frames (stored per user on Railway) will be used to fine-tune a custom CNN on real-world facial skin data across Fitzpatrick skin tones I–VI — a dataset gap that existing models like ISIC (which skews heavily toward lighter tones) don't address.

The long-term architecture replaces the LLM scoring layer with a trained classification and regression model, and evaluates domain-specific medical LLMs (BioMistral, Meditron) as replacements for the general-purpose Claude analysis layer.

---

## Author

**Olumide Aisida** — Computer Science, Bowie State University  
Built solo as a full-stack product project combining CV, LLM integration, cloud deployment, and subscription billing.