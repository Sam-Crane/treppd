# TREPPD

**Bureaucracy Co-Pilot for Immigrants in Germany**

*Navigate Germany. Step by step.*

Treppd is an AI-powered bureaucracy co-pilot that guides immigrants through German administrative processes. It combines a verified, human-curated knowledge base with a Claude AI layer to deliver personalised step-by-step roadmaps, field-by-field form guidance, and document preparation checklists — all in the user's preferred language.

---

## The Problem

Non-EU immigrants in Germany face a fragmented, opaque bureaucratic system:

- **400,000+** international students and **300,000+** skilled workers on non-EU visas
- No single source covers all visa types, cities, and personal situations
- Official forms are German-only with legal terminology
- Missing one document means rebooking appointments 6-12 weeks out
- Steps must be completed in strict order, but this dependency map exists nowhere
- **15-40 hours** lost per person navigating bureaucracy in the first three months

## The Solution

Treppd acts as a smart personal assistant for every immigrant's bureaucratic journey:

1. **Situation Profiler** — Tell us your visa type, nationality, city, and goal
2. **Personalised Roadmap** — Get your step-by-step journey with realistic timelines
3. **Form-Filling Guides** — Field-by-field walkthrough for every official form
4. **Document Checklist** — Exactly which documents to prepare, with specifications
5. **AI Guidance Chat** — Ask questions in plain language at any step
6. **Deadline Alerts** — Never miss a visa expiry or statutory deadline

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 14 (PWA) | React app with offline support, Vercel hosting |
| Core API | NestJS (Node.js) | Auth, profiles, roadmap, forms — public-facing |
| Intelligence API | FastAPI (Python) | Claude AI enrichment, RAG, rules engine — internal only |
| AI Provider | Anthropic Claude API | Roadmap enrichment, conversational guidance |
| Database | PostgreSQL (Supabase) | EU Frankfurt region, row-level security |
| Cache | Redis | Session caching, notification queue |
| Monorepo | Turborepo | Build orchestration across all services |
| CI/CD | GitHub Actions | Lint, test, build on PR; auto-deploy on merge |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT LAYER                      │
│         Next.js 14 PWA        Flutter (Phase 2)     │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS (public)
┌────────────────────▼────────────────────────────────┐
│              NestJS CORE API :3001                  │
│   /auth  /profiles  /roadmap  /forms  /documents    │
│              (Railway — public)                     │
└────────────────────┬────────────────────────────────┘
                     │ Internal HTTP (private network)
┌────────────────────▼────────────────────────────────┐
│          FastAPI INTELLIGENCE API :8000              │
│    /roadmap/generate  /ai/chat  /ai/explain  /rules │
│          (Railway — NOT exposed to internet)        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  DATA LAYER                         │
│      PostgreSQL (Supabase EU)    Redis (Railway)    │
└─────────────────────────────────────────────────────┘
```

**Key principle:** Node.js owns the product. Python owns the intelligence. The frontend never calls Python directly. If Python is unavailable, NestJS falls back to serving raw database steps — users always see something useful.

---

## Project Structure

```
treppd/
├── apps/
│   ├── web/                    # Next.js 14 PWA
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, onboarding
│   │   │   └── (app)/          # Dashboard, roadmap, documents, chat, settings
│   │   ├── components/         # UI components (onboarding, dashboard, roadmap, documents)
│   │   ├── lib/                # API client, Supabase client, Zod schemas
│   │   └── stores/             # Zustand state stores
│   │
│   ├── api-node/               # NestJS core API
│   │   └── src/
│   │       ├── auth/           # JWT auth via Supabase
│   │       ├── profiles/       # User profile CRUD
│   │       ├── roadmap/        # Roadmap generation + Python service client
│   │       ├── documents/      # Document checklists
│   │       ├── supabase/       # Global Supabase client
│   │       └── redis/          # Global Redis client
│   │
│   └── api-python/             # FastAPI intelligence service
│       ├── routers/            # roadmap, ai, rules endpoints
│       ├── services/           # Roadmap generation pipeline, RAG
│       ├── prompts/            # Claude system + user prompts
│       └── models.py           # Pydantic request/response models (OpenAPI contract)
│
├── packages/
│   └── shared-types/           # TypeScript interfaces shared by web + api-node
│
├── supabase/
│   ├── config.toml             # Local Supabase config
│   └── migrations/             # Database schema + seed data
│
├── docker-compose.yml          # Local dev: all services with one command
├── turbo.json                  # Turborepo pipeline config
└── .github/workflows/          # CI + staging/production deploy
```

---

## Getting Started

### Prerequisites

- **Node.js 20 LTS** — `nvm install 20 && nvm use 20`
- **Python 3.11+** — `pyenv install 3.11 && pyenv global 3.11`
- **Docker Desktop 4.x** — must be running
- **Supabase CLI** — `npm install -g supabase`

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Sam-Crane/treppd.git
cd treppd

# 2. Install dependencies
npm install
cd apps/api-python && pip install -r requirements.txt && cd ../..

# 3. Configure environment
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY,
#          ANTHROPIC_API_KEY, INTERNAL_API_KEY (from team vault)

# 4. Start database
supabase start
supabase db reset    # Runs all migrations + seed data

# 5. Start all services
docker-compose up    # PostgreSQL + Redis
turbo dev            # web :3000, api-node :3001, api-python :8000
```

### Running Tests

```bash
# All workspaces
turbo test

# Individual services
turbo test --filter=api-node
cd apps/api-python && pytest -v

# With coverage
turbo test -- --coverage
```

### Linting

```bash
turbo lint                                    # All workspaces
cd apps/api-python && ruff check .            # Python only
```

---

## Features

### MVP (Phase 1 — March to July 2026)

| Feature | Priority | Status |
|---------|----------|--------|
| Situation Profiler | Must Have | Built |
| Personalised Roadmap | Must Have | Built |
| Document Preparation Checklist | Must Have | Built |
| Progress Tracker | Must Have | Built |
| Form-Filling Guide | Should Have | Planned |
| AI Guidance Chat | Should Have | Planned |
| Appointment Email Generator | Should Have | Planned |
| Deadline Alerts | Should Have | Planned |

### Phase 2 (Post-Semester)

- Flutter mobile app (iOS + Android)
- Community layer — verified tips from other immigrants
- Document scanner — AI-powered document validation
- Lawyer connect — in-app referral to vetted immigration lawyers
- B2B dashboard — cohort tracking for universities and employers
- Full 16-Bundesland coverage

---

## Hybrid Roadmap Generation

The core differentiator: a verified database + AI enrichment pipeline.

```
1. DB Fetch     → Verified steps filtered by visa type + Bundesland
2. Documents    → Document requirements joined per step
3. AI Enrich    → Claude adds explanations, tips, wait time estimates
4. Deadlines    → Computed from arrival date and visa expiry
5. Persist      → Saved with profile snapshot for auditability
6. Audit Log    → Every AI call logged (no PII)
```

**Data integrity rule:** The AI can only *enrich* verified steps — it cannot change official form names, office names, or document requirements. AI-added steps are flagged with `ai_suggested: true` and a verification notice.

---

## Database

PostgreSQL via Supabase (EU Frankfurt). Row-level security on all user tables.

**Core tables:** `users`, `user_profiles`, `user_roadmaps`

**Content tables (human-curated):** `roadmap_steps`, `document_requirements`, `forms`

**AI/Audit tables:** `ai_conversations`, `ai_generation_logs`, `ai_feedback`

### Seed Data Coverage

| Bundesland | Student Visa | Work Permit |
|-----------|-------------|-------------|
| Bavaria (DE-BY) | Seeded | Seeded |
| Berlin (DE-BE) | Seeded | Seeded |
| NRW (DE-NW) | Seeded | Seeded |

---

## API Endpoints

### NestJS Public API (`:3001`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/register | Public | Register user |
| POST | /auth/login | Public | Authenticate |
| POST | /auth/refresh | Public | Refresh token |
| GET | /auth/me | JWT | Get current user |
| GET | /profiles/me | JWT | Get profile |
| POST | /profiles | JWT | Create profile (onboarding) |
| PATCH | /profiles/me | JWT | Update profile |
| GET | /roadmap | JWT | Get active roadmap |
| POST | /roadmap/generate | JWT | Generate roadmap |
| PATCH | /roadmap/steps/:slug/complete | JWT | Complete step |
| GET | /roadmap/progress | JWT | Progress stats |
| GET | /documents/checklist | JWT | Full document checklist |
| GET | /documents/checklist/:step_slug | JWT | Per-step checklist |

### FastAPI Internal API (`:8000`) — Private network only

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /roadmap/generate | Hybrid DB + AI roadmap generation |
| POST | /ai/chat | RAG-powered chat |
| POST | /ai/explain-field | Form field explanation |
| POST | /ai/appointment-email | German appointment email |
| POST | /rules/compute-deadlines | Deadline calculation |
| POST | /rules/validate-sequence | Dependency validation |
| GET | /rules/offices/:bundesland | Office contact details |

---

## Security

- **JWT via Supabase** — 1hr access tokens, 7-day refresh tokens
- **Row-Level Security** — Users can only access their own data
- **Internal API key** — FastAPI validates `X-Internal-Key` on every request
- **No PII in logs** — AI generation logs contain only visa type, Bundesland, goal
- **GDPR erasure** — `DELETE /profiles/me` cascades all user data
- **Helmet headers** — CSP, HSTS, X-Frame-Options, rate limiting
- **EU data residency** — Supabase Frankfurt region

---

## CI/CD

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | PR to main/develop | Lint, test, build all workspaces |
| `deploy-staging.yml` | Push to develop | Deploy to Railway staging + Vercel preview |
| `deploy-prod.yml` | Push to main | Deploy to Railway prod + Vercel prod |

---

## Git Workflow

```
main (protected)  ← production deploys via PR
└── develop       ← staging deploys, daily work
    └── feature/* ← feature branches, PR to develop
```

---

## Team

| Role | Responsibilities |
|------|-----------------|
| Product Manager | Content curation, milestones, coach liaison |
| Business Lead | User interviews, business model, financials |
| Frontend Developer | Next.js PWA, UI components, accessibility |
| AI/Backend Developer | NestJS, FastAPI, database, Claude AI pipeline |

---

## Test Coverage

| Layer | Tests | Focus |
|-------|-------|-------|
| NestJS | 10 unit tests | Roadmap caching, fallback, progress, step completion |
| FastAPI | 16 unit tests | DB filtering, Claude enrichment, deadline parsing, PII stripping, API key |
| Frontend | Planned | Component tests with Vitest + React Testing Library |

---

## Target Users

- **Non-EU international students** in Germany (400,000+)
- **Skilled workers** on non-EU visas (300,000+)
- **Universities** — white-label for international student offices
- **Companies** — HR onboarding tool for foreign hires

## Initial Markets

Bavaria, Berlin, North Rhine-Westphalia — covering ~60% of Germany's international student and skilled worker population.

---

## License

Proprietary. All rights reserved.

## Course

Digital Product Development 26S — TH Deggendorf (European Campus), March–July 2026.
