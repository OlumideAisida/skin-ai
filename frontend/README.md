# SkinAI

**AI-powered facial skin analysis web app** — real-time scanning, RAG-grounded clinical recommendations, personalized reports, and a subscription paywall built end-to-end as a solo full-stack project.

🔗 **Live:** [skin-ai-two.vercel.app](https://skin-ai-two.vercel.app)

---

## What It Does

SkinAI uses computer vision and a large language model to analyze facial skin in real time through a webcam. Users get a structured health report covering skin tone (Fitzpatrick scale), hydration, clarity, texture, and personalized product recommendations — all calibrated for darker skin tones that most consumer skincare tools ignore.

The normal scan returns a short 3-section teaser report (skin tone, top 3 issues, recommended routine) designed to surface key insights quickly and direct users to the deep analysis. The deep analysis generates a full clinical-style breakdown across six categories: skin assessment, nutrition, skincare routine, lifestyle factors, weekly progress tracking, and a prioritized action plan.

All recommendations are grounded in a **Retrieval-Augmented Generation (RAG)** pipeline backed by a curated dermatology knowledge base of 41 conditions stored as vector embeddings in Supabase. User-declared Fitzpatrick skin type and gender are injected into every Claude prompt, making every analysis personalized rather than generic.

Deep analysis is gated behind a Stripe subscription after two free trials.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Framer Motion |
| Backend | FastAPI (Python), Uvicorn |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Embeddings | OpenAI text-embedding-3-small |
| Vector Search | Supabase pgvector + custom RPC function |
| Auth | Supabase Auth (JWT) |
| Database | Supabase (PostgreSQL) |
| Payments | Stripe (subscription billing + webhooks) |
| Frontend Deploy | Vercel |
| Backend Deploy | Railway |
| Storage | Railway Volume (saved frames) |

---

## Features

- **Real-time webcam scan** — oval-clipped mirrored viewport with face guide overlay and scanning line animation
- **Short-form teaser report** — 3-section numbered report (skin tone, top 3 issues, recommended routine) with CTA to deep analysis
- **RAG-grounded recommendations** — every report grounded in retrieved clinical context from the dermatology knowledge base
- **Deep Analysis** — 6-section clinical breakdown with expandable detail sections per category
- **User onboarding** — 2-step flow capturing Fitzpatrick skin type (with visual swatches) and gender on first login
- **Personalized prompts** — Fitzpatrick type and gender injected into every Claude prompt via `build_user_context()`
- **Concern-focused scans** — users can target specific concerns (oiliness, acne, glow, protection) for weighted analysis
- **Quantified scores** — moisture, clarity, evenness, and overall skin health as animated circular progress rings
- **Scan history** — all reports saved per user, viewable and deletable from the History tab
- **Paywall** — 2 free deep analyses, then Stripe checkout for $4.99/month unlimited access
- **Profile page** — editable display name, skin tone swatch, gender, plan status, total scan count, notifications toggle
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
            ├── /analyze              POST ── Claude Haiku vision + RAG → short report + scores
            ├── /analyze/deep         POST ── Claude Haiku vision + RAG → structured JSON report
            ├── /history              GET  ── fetch user's saved reports
            ├── /history/:id          DELETE── delete a report
            ├── /profile              GET  ── subscription status, trial count, fitzpatrick, gender
            ├── /profile/onboard      POST ── save fitzpatrick_type and gender on first login
            ├── /create-checkout-session POST── Stripe checkout
            └── /webhook              POST ── Stripe subscription events
                    │
                    └── Supabase DB (PostgreSQL + pgvector)
                            ├── profiles       (user_id, deep_analysis_count, is_subscribed,
                            │                   stripe_customer_id, fitzpatrick_type, gender)
                            ├── reports        (user_id, analysis, scores, frame_path, created_at)
                            └── dermatology_kb (condition_name, category, content,
                                               fitzpatrick_relevance, embedding VECTOR(1536))

RAG Pipeline (per request):
    query text → OpenAI text-embedding-3-small → 1536-dim vector
    → Supabase RPC match_dermatology_kb (cosine similarity, top_k=3-4)
    → retrieved clinical context injected into Claude prompt
```

---

## RAG Pipeline

The dermatology knowledge base contains 41 hand-curated conditions covering:

- Inflammatory conditions (acne, eczema, rosacea, psoriasis, contact dermatitis)
- Pigmentation disorders (PIH, melasma, hyperpigmentation, vitiligo, tinea versicolor)
- Structural concerns (keratosis pilaris, stretch marks, keloids, ingrown hairs)
- Active ingredients (niacinamide, retinoids, AHAs/BHAs, azelaic acid, hyaluronic acid)
- Fitzpatrick-specific guidance per condition
- Sun protection, moisturizers, and skincare fundamentals

Each entry is embedded using `text-embedding-3-small` and stored with pgvector. At query time, the user's concern (or a general skin query) is embedded and matched via cosine similarity. Results above 0.3 similarity are injected as a `CLINICAL KNOWLEDGE BASE` block into the Claude prompt.

The Supabase RPC function:

```sql
CREATE OR REPLACE FUNCTION match_dermatology_kb(
    query_embedding VECTOR(1536),
    match_count INT DEFAULT 3
)
RETURNS TABLE (id UUID, content TEXT, condition_name TEXT,
               category TEXT, fitzpatrick_relevance TEXT, similarity FLOAT)
LANGUAGE SQL STABLE AS $$
    SELECT id, content, condition_name, category, fitzpatrick_relevance,
           1 - (embedding <=> query_embedding) AS similarity
    FROM public.dermatology_kb
    ORDER BY embedding <=> query_embedding
    LIMIT match_count;
$$;
```

---

## Onboarding Flow

On first login, users are shown a 2-step onboarding modal before accessing the app:

1. **Skin Tone** — 6 options with visual color swatches representing Fitzpatrick Types I–VI, each with a one-line UV sensitivity description
2. **Gender** — 4 options (Female, Male, Non-binary, Prefer not to say)

Both values are saved to the `profiles` table via `POST /profile/onboard` and returned on every `/profile` GET. They are injected into every Claude prompt via `build_user_context()`:

```python
def build_user_context(fitzpatrick_type, gender) -> str:
    # Returns a USER PROFILE block with Fitzpatrick label and gender
    # Instructs Claude to prioritize PIH prevention for Types IV-VI
```

The onboarding screen triggers when `fitzpatrick_type` is null in the user's profile. Users can update their skin tone at any time from the Profile page.

---

## Local Development

**Prerequisites:** Node.js, Python 3.10+, a Supabase project, Anthropic API key, OpenAI API key

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
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

```bash
uvicorn main:app --reload
# Backend runs on http://localhost:8000
```

### Populate the Knowledge Base (one-time)

```bash
python populate_kb.py
# Inserts 41 dermatology conditions with embeddings into Supabase
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
| fitzpatrick_type | int4 | Fitzpatrick skin type 1–6, set during onboarding |
| gender | text | User gender, set during onboarding |

### `reports`
| Column | Type | Description |
|---|---|---|
| id | uuid | Auto-generated report ID |
| user_id | uuid | Foreign key to profiles |
| analysis | text | Full markdown analysis from Claude |
| scores | jsonb | skin_health, moisture, clarity, evenness, severity |
| frame_path | text | Path to saved webcam frame on Railway volume |
| created_at | timestamptz | Scan timestamp |

### `dermatology_kb`
| Column | Type | Description |
|---|---|---|
| id | uuid | Auto-generated entry ID |
| condition_name | text | Name of condition or ingredient |
| category | text | Classification (Inflammatory, Pigmentation, etc.) |
| content | text | Full clinical description |
| source | text | Content source attribution |
| fitzpatrick_relevance | text | Skin tone-specific clinical notes |
| embedding | vector(1536) | OpenAI text-embedding-3-small vector |

---

## Deployment

**Frontend (Vercel)**
- Push to `main` → auto-deploy
- Environment variables: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`, `CI=false`

**Backend (Railway)**
- Connected to GitHub repo, auto-deploys on push
- Environment variables: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`
- Volume mounted at `RAILWAY_VOLUME_MOUNT_PATH` for frame storage

---

## Engineering Challenges

These are real obstacles encountered during development — documented as they actually happened, not sanitized for a portfolio.

**Supabase auth schema corruption requiring full project migration** — After initial deployment, new user signups started returning "Database error creating new user" both via the API and directly from the Supabase dashboard. No triggers existed on `auth.users`, RLS was disabled on all public tables, and the auth schema appeared intact on inspection. After two weeks without resolution from a Supabase support ticket, migrated the entire project to a new Supabase instance. All application code stayed identical — only four environment variables changed across Railway, Vercel, and local `.env`.

**Supabase RLS blocking backend inserts** — Row Level Security was enabled by default on the `profiles` and `reports` tables. The backend uses the service role key which should bypass RLS, but inserts were still failing. Fixed by explicitly disabling RLS on both tables since authentication is handled at the FastAPI layer via JWT verification.

**pgvector schema placement breaking RPC calls** — Enabling pgvector in the `extensions` schema (Supabase default) caused the `match_dermatology_kb` RPC to return "function does not exist" errors when called from the `public` schema. Fixed by re-enabling the pgvector extension directly in the `public` schema.

**RAG user context silently dropped due to indentation bug** — The `user_context` block was accidentally nested inside the `if clinical_context:` block, meaning Fitzpatrick type and gender were only injected into the prompt when RAG returned results and were silently dropped otherwise. Refactored into a top-level `build_user_context()` helper function called independently of the RAG pipeline.

**Railway deployment failing on `dotenv` import** — Production environment doesn't have `python-dotenv` installed the same way as local. Fixed by wrapping the import in a try/except so the app starts cleanly whether or not the package is present.

**CI=true treating React warnings as hard errors** — Vercel sets `CI=true` in its build environment, which causes Create React App to treat ESLint warnings as build-breaking errors. Fixed by adding `CI=false` as a Vercel environment variable.

**Pydantic 422 on null concern field** — The `concern` field in `ImagePayload` is typed as `Optional[str]`, but when the frontend sent `concern: null` explicitly in the JSON body, Pydantic rejected it with a 422 Unprocessable Content error. Fixed by using spread syntax in the fetch call to omit the field entirely when it has no value.

**Score anchoring to ~70%** — Claude defaults to middle-of-the-range scores regardless of actual skin condition because it lacks a calibrated reference distribution. Partially addressed with a detailed scoring rubric in the prompt. Full fix deferred to Stage 2 ML — a trained regression model on labeled skin condition data.

**Deep analysis JSON parsing** — Claude occasionally wraps JSON responses in markdown code fences despite explicit instructions not to. Backend strips leading ` ```json ` fences before parsing, with a comprehensive fallback response object if parsing still fails.


**Camera lag on oval viewport** — The oval CSS clip (`border-radius: 50%` with `overflow: hidden`) combined with `transform: scaleX(-1)` for mirror effect caused GPU compositing lag. Fixed by adding `willChange: "transform"` to promote the element to its own compositor layer.

---

## Research Extension

This project is the foundation for Stage 2 ML research being conducted as part of a **2026 SURI Fellowship** at Bowie State University. The saved webcam frames (stored per user on Railway) will be used to fine-tune a custom CNN on real-world facial skin data across Fitzpatrick skin tones I–VI — a dataset gap that existing models like ISIC (which skews heavily toward lighter tones) don't address.

The long-term architecture replaces the LLM scoring layer with a trained classification and regression model, and evaluates domain-specific medical LLMs (BioMistral, Meditron) as replacements for the general-purpose Claude analysis layer.

---

## Author

**Olumide Aisida** — Computer Science, Bowie State University  
Built solo as a full-stack product project combining CV, LLM integration, RAG pipelines, cloud deployment, and subscription billing.