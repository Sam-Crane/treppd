# TREPPD

**Bureaucracy Co-Pilot for Immigrants in Germany**

*Navigate Germany. Step by step.*

Treppd is an AI-powered bureaucracy co-pilot that guides immigrants through German administrative processes. It combines a verified, human-curated knowledge base with a Claude AI layer to deliver personalised step-by-step roadmaps, field-by-field form guidance, and document preparation checklists.

---

## Table of Contents

1. [The Problem & Solution](#the-problem)
2. [Quick Start (Codespaces / Local)](#quick-start)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Tech Stack](#tech-stack)
6. [Development Workflow — Human + AI Collaboration](#development-workflow--human--ai-collaboration)
7. [Optimization Dimensions](#optimization-dimensions)
8. [API Reference](#api-reference)
9. [Database Schema](#database-schema)
10. [Security](#security)
11. [Testing](#testing)
12. [CI/CD](#cicd)

---

## The Problem

Non-EU immigrants in Germany face a fragmented, opaque bureaucratic system:

- **400,000+** international students and **300,000+** skilled workers on non-EU visas
- No single source covers all visa types, cities, and personal situations
- Official forms are German-only with legal terminology
- Missing one document means rebooking appointments 6–12 weeks out
- Steps must be completed in strict order, but this dependency map exists nowhere
- **15–40 hours** lost per person navigating bureaucracy in the first three months

## The Solution

Treppd acts as a smart personal assistant for every immigrant's bureaucratic journey:

1. **Situation Profiler** — Tell us your visa type, nationality, city, and goal
2. **Personalised Roadmap** — Step-by-step journey with realistic timelines
3. **Form-Filling Guides** — Field-by-field walkthrough of every official form
4. **Document Checklist** — Exactly which documents to prepare, with specifications
5. **AI Guidance Chat** — Ask questions in plain language at any step
6. **Deadline Alerts** — Never miss a visa expiry or statutory deadline

---

## Quick Start

### Option A — GitHub Codespaces (recommended for reviewers)

Click **Code → Codespaces → Create codespace on develop**.

The devcontainer (`.devcontainer/devcontainer.json`) auto-runs `post-create.sh` which installs dependencies, seeds `.env` from `.env.example`, and forwards all ports.

Then in the Codespaces terminal:
```bash
docker-compose up --build     # Full containerized stack
# OR
turbo dev                      # Fast local dev (Node + Python hot reload)
```

Forwarded ports:
- `3000` Next.js web (opens automatically)
- `3001` NestJS API
- `8000` FastAPI intelligence (internal only in prod, exposed for testing in Codespaces)
- `6379` Redis
- `54321–54323` Supabase (local stack)

### Option B — Local machine

Prerequisites: **Node.js 20 LTS**, **Python 3.11+**, **Docker Desktop**, **Supabase CLI**.

```bash
git clone https://github.com/Sam-Crane/treppd.git && cd treppd
npm install
cd apps/api-python && pip install -r requirements.txt && cd ../..
cp .env.example .env    # fill in SUPABASE_URL, ANTHROPIC_API_KEY, etc.
supabase start && supabase db reset
docker-compose up --build
```

Visit `http://localhost:3000`.

### Running individual commands
```bash
turbo dev                      # All services in dev mode with hot reload
turbo build                    # Build all workspaces
turbo test                     # Run all test suites
turbo lint                     # Lint all workspaces
cd apps/api-python && pytest  # Python tests only
```

---

## Architecture

### Principle
> **Node.js owns the product. Python owns the intelligence. The frontend never calls Python directly.**

If Python is unavailable, NestJS gracefully falls back to serving raw database steps. Users always get a functional response.

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
                     │ Internal HTTP + X-Internal-Key
                     │ (private Railway network only)
┌────────────────────▼────────────────────────────────┐
│          FastAPI INTELLIGENCE API :8000             │
│    /roadmap/generate  /ai/chat  /ai/explain  /rules │
│          (Railway — NOT exposed to internet)        │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│                  DATA LAYER                         │
│      PostgreSQL (Supabase EU)    Redis (Railway)    │
└─────────────────────────────────────────────────────┘
```

### Hybrid Roadmap Generation (the core differentiator)

```
1. DB Fetch     → Verified steps filtered by visa type + Bundesland
2. Documents    → Document requirements joined per step
3. AI Enrich    → Claude adds explanations, tips, wait-time estimates
4. Deadlines    → Computed from arrival date and visa expiry
5. Persist      → Saved with profile snapshot for auditability
6. Audit Log    → Every AI call logged (no PII)
```

**Data integrity rule:** The AI can only *enrich* verified steps — it cannot change official form names, office names, or document requirements. AI-added steps are flagged `ai_suggested: true` with a visible verification notice.

---

## Project Structure

```
treppd/
├── .devcontainer/              # GitHub Codespaces configuration
├── .github/workflows/          # CI (PR) + staging + production deploys
├── apps/
│   ├── web/                    # Next.js 14 PWA (multi-stage Dockerfile)
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, onboarding
│   │   │   └── (app)/          # Dashboard, roadmap, documents, etc.
│   │   ├── components/         # UI by domain (onboarding, roadmap, …)
│   │   ├── lib/                # API client, Supabase client, Zod schemas
│   │   └── stores/             # Zustand state
│   │
│   ├── api-node/               # NestJS core API (multi-stage Dockerfile)
│   │   └── src/
│   │       ├── auth/           # JWT auth via Supabase
│   │       ├── profiles/       # Profile CRUD + roadmap invalidation
│   │       ├── roadmap/        # Roadmap + PythonService w/ fallback
│   │       ├── documents/      # Document checklists
│   │       ├── supabase/       # Global Supabase client
│   │       └── redis/          # Global Redis client
│   │
│   └── api-python/             # FastAPI intelligence (multi-stage Dockerfile)
│       ├── routers/            # roadmap, ai, rules
│       ├── services/           # RoadmapService (6-step pipeline), RAG
│       ├── prompts/            # Claude system + user prompts
│       └── models.py           # Pydantic models (OpenAPI contract)
│
├── packages/shared-types/      # TypeScript interfaces shared web↔api-node
├── supabase/migrations/        # DB schema + seed data (Bavaria, Berlin, NRW)
├── docker-compose.yml          # Full containerized stack
├── .dockerignore
└── turbo.json                  # Turborepo pipeline (lint, test, build, dev)
```

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | Next.js 14 (PWA) | React app with offline support, service worker |
| Core API | NestJS 11 (Node.js 20) | Public-facing auth, profiles, roadmap, forms |
| Intelligence API | FastAPI (Python 3.11) | Claude AI enrichment, RAG pipeline, rules engine |
| AI Provider | Anthropic Claude Sonnet 4 | Roadmap enrichment, conversational guidance |
| Database | PostgreSQL 17 (Supabase) | EU Frankfurt region, row-level security |
| Cache | Redis 7 | Session cache, notification queue |
| Monorepo | Turborepo 2 | Build orchestration, task caching |
| Containers | Docker + docker-compose | Reproducible local and production environments |
| Codespaces | devcontainer.json | One-click cloud dev environment |
| CI/CD | GitHub Actions | Lint + test + build on PR, auto-deploy on merge |
| Hosting | Railway + Vercel | Container orchestration + edge CDN |

---

## Development Workflow — Human + AI Collaboration

Treppd is developed by a **hybrid team** of human specialists working alongside AI coding agents. The strategy intentionally splits responsibilities based on where each party adds most value, and uses asynchronous delegation to keep the whole team moving.

### Team Composition

| Member | Type | Primary Responsibilities |
|--------|------|--------------------------|
| **Product Manager** | Human | Vision, roadmap curation (verified step database), stakeholder interviews, milestone delivery, coach liaison, scope decisions |
| **Business Lead** | Human | User research (10+ interviews/milestone), personas, market sizing, unit economics, pricing, competitive analysis |
| **Frontend Engineer** | Human | Architecture decisions, component library direction, UX reviews, accessibility audits, code reviews of AI output |
| **AI/Backend Engineer** | Human | System architecture, Claude prompt engineering, RAG pipeline design, security reviews, deployment oversight |
| **Claude Code (Opus 4.6)** | AI Agent | Foreground pair-programming: boilerplate, refactors, tests, documentation, routine debugging |
| **Claude subagents** | AI Agent | Asynchronous background tasks: multi-file scaffolding, parallel feature builds, codebase exploration |

### Human vs AI Responsibility Matrix

| Task Category | Owner | Why |
|---------------|-------|-----|
| Product vision, scope, trade-offs | Human | Requires stakeholder context and values |
| Architecture design | Human-led, AI-assisted | Humans decide; AI validates and elaborates |
| Implementation (boilerplate) | AI-led, human-reviewed | Fast, high-quality, deterministic output |
| Implementation (novel logic) | Human-led, AI-assisted | Humans design the algorithm; AI scaffolds |
| Test writing | AI-led, human-reviewed | AI covers edge cases humans miss |
| Documentation | AI-led, human-edited | AI writes drafts fast; humans ensure accuracy |
| Content curation (bureaucracy data) | Human-only | Requires source verification against official sites |
| Security-sensitive code | Human-led, AI-reviewed | AI reviews for OWASP issues; humans own responsibility |
| Dependency and vendor choices | Human | Has long-term lock-in consequences |
| UI/UX copy tone | Human | Brand voice requires human judgment |
| Commit messages, PR descriptions | AI-drafted, human-approved | AI summarises; humans verify accuracy |

### Asynchronous Agent Execution

For larger work streams we run multiple AI subagents in parallel using the `run_in_background` pattern. A typical multi-feature sprint looks like:

```
┌─ Main thread (human + Claude in foreground)
│    Planning, architecture decisions, code review
│
├─ Background subagent A: "Build onboarding form + dashboard"
│    Scaffolds 10 files, writes Zod schemas, Zustand store
│    Reports back with summary when complete
│
├─ Background subagent B: "Build roadmap + documents pages"
│    Scaffolds 7 files, implements status logic and mutations
│    Reports back with summary when complete
│
└─ Main thread resumes — verifies builds, fixes lint issues, commits
```

Phase 2 of this project produced **17 frontend files + 16 tests** this way, with the main thread simultaneously implementing the FastAPI 6-step pipeline. Total elapsed time: under 2 hours for what would otherwise take a day.

### Keeping Direction Coherent

Multi-agent software development risks divergence — agents can happily produce internally consistent code that contradicts other parts of the system. We mitigate this with three structural mechanisms:

1. **Living source-of-truth documents**
   - `/docs/CLAUDE.md` — persistent project configuration read by every agent session
   - `/docs/playbook.md` — sprint-by-sprint plan with acceptance criteria
   - `/docs/implementation/` — per-phase implementation specs (code patterns, seed data, test cases)
   - Any agent, fresh or continuing, reads these first to align.

2. **Explicit interface contracts**
   - `packages/shared-types/` — TypeScript interfaces consumed by web + api-node
   - `apps/api-python/models.py` — Pydantic models defining the NestJS↔FastAPI boundary
   - FastAPI auto-generates OpenAPI from these Pydantic models → the **agreed contract** between the two backend services
   - Agents working on either side of a boundary cannot drift, because the contract is validated at compile time (TS) and runtime (Pydantic).

3. **Deterministic verification gates**
   - Every agent task ends with `turbo build + turbo test + turbo lint`
   - Any failure is caught before commit, not in review
   - CI on GitHub enforces the same gates on every PR
   - Agents self-correct when verification fails (we watched Claude fix 26 lint errors across 8 files in a single turn in Phase 1)

### Git Workflow Under Hybrid Development

```
main (protected)          ← production, PR-only
 └── develop              ← staging auto-deploys, daily working branch
     ├── feature/...      ← optional for complex features
     └── (direct commits) ← for small increments
```

Commits are **human-authored and human-approved** even when AI produced most of the diff. Humans write (or edit) the commit message, verify the diff, and choose when to push. No automatic commits. This keeps the audit trail human-owned — essential for a product that gives guidance on legal-adjacent matters.

### Typical Daily Flow

1. **Human opens the repo.** Skims `TodoWrite` list from last session (Claude persists it).
2. **Morning planning.** Human + Claude review what's next in the playbook. Human makes scope calls. Claude spawns `EnterPlanMode` for anything non-trivial.
3. **Parallel execution.** Human works on one feature; subagents on 1–3 others.
4. **Continuous integration.** Each chunk runs `turbo build test lint` before commit.
5. **Commit checkpoint.** Human reviews staged changes, approves message, pushes.
6. **End of session.** Claude updates `TodoWrite` and any relevant doc files so tomorrow's session can continue seamlessly.

---

## Optimization Dimensions

### Performance
- **Cached roadmap retrieval:** < 300 ms (Supabase indexed query on `user_id` + `expires_at`)
- **Roadmap generation (p95):** < 8 s end-to-end (DB 50 ms + Claude 5-6 s + persist 100 ms)
- **Next.js LCP on 4G:** target < 2.5 s (Lighthouse score 85+)
- **Frontend:** Next.js App Router + Server Components minimise client bundles; TanStack Query caches API responses with 5 min `staleTime`
- **Backend:** Anthropic **prompt caching** on static system prompts reduces input tokens by ~90% after first call
- **Database:** GIN indexes on `roadmap_steps.visa_types` and `bundeslaender` arrays

### Development Time
- Turborepo task caching + remote cache → incremental builds
- Hot reload across all three services (`turbo dev`)
- AI-assisted scaffolding cuts boilerplate time to near zero
- Shared TypeScript types eliminate integration debugging between frontend and NestJS
- Devcontainer + `post-create.sh` = new contributor is productive in < 5 minutes

### Cost
- **Claude API:** Prompt caching + `claude-sonnet-4` (not Opus) → ~€0.02–0.05 per roadmap generation
- **Infrastructure:** Railway (~€20–50/month), Supabase free tier for MVP, Vercel free tier for frontend
- **AI audit:** Every call logged to `ai_generation_logs` with token counts for cost attribution
- **Fallback path is free:** if Claude is down, users still get functional roadmaps from the DB

### Accuracy
- **Hybrid architecture:** Verified DB data is the source of truth; AI enriches but cannot mutate verified fields (title, office, document requirements)
- **System prompt forbids** changing official form names, office names, or document specs
- **Post-processing validation:** Server-side code overwrites any AI-modified verified fields with DB values before persisting
- **`verified_at` date** shown on every step; `source_url` links to official government pages
- **Feedback loop:** `ai_feedback` table captures user ratings; consistently helpful AI-suggested steps get promoted to the verified DB after human review

### Usability
- **Progressive Web App:** add-to-homescreen, offline caching, responsive design
- **5-step onboarding** under 2 minutes with smart conditionals (university field for students, employer field for workers)
- **Mobile-first navigation:** desktop top bar + mobile bottom tab bar
- **Status indicators:** completed (green), available (blue), blocked (grey with lock icon)
- **Deadline urgency:** colour-coded urgency (red ≤ 7 days, amber ≤ 30, blue otherwise)
- **Optimistic mutations** (TanStack Query) → instant UI feedback on "mark complete"
- **German + English** labels on every form field

### Security
- **Supabase RLS** on every user-facing table (`USING (auth.uid() = user_id)`)
- **JWT authentication** via Supabase, 1 hr access + 7-day refresh tokens
- **Internal API key** validates NestJS↔FastAPI calls; Python service is not on public DNS
- **Helmet middleware** applies CSP, HSTS, X-Frame-Options, Referrer-Policy
- **Global `ValidationPipe`** with `whitelist + forbidNonWhitelisted` rejects all unrecognised fields
- **Class-validator DTOs** at every API boundary
- **Rate limiting** via `@nestjs/throttler` (100/min public, 300/min authenticated)
- **No PII in AI logs** — only visa type, Bundesland, goal, nationality
- **Secrets never committed** — `.env` in `.gitignore`, `.env.example` in repo
- **GDPR erasure:** `DELETE /profiles/me` cascades all user data via FK constraints
- **EU data residency:** Supabase Frankfurt region

### Scalability
- **Stateless services:** NestJS and FastAPI both scale horizontally; no in-memory session state
- **Redis** for shared session + job queue state
- **Supabase** managed Postgres with connection pooling
- **Docker multi-stage builds** produce minimal runtime images (~150 MB Node, ~200 MB Python)
- **Railway auto-scaling** configured via replica count in production
- **Vercel edge network** serves the frontend globally

### Extensibility / Maintainability
- **Modular NestJS architecture:** each domain is its own module (`auth`, `profiles`, `roadmap`, `documents`) with controllers/services/DTOs
- **Typed API contracts:** Pydantic (Python) ↔ TypeScript interfaces (shared-types package)
- **Database migrations** under `supabase/migrations/` with timestamped filenames
- **Content is data, not code:** adding a new visa type means inserting DB rows, not shipping code
- **Clean boundaries:** frontend never calls Python; DB writes go through service layer with audit logging; no direct SQL from controllers
- **Conventions enforced:** ESLint + Prettier (TypeScript), Ruff + MyPy (Python)

### Traceability
- **Every AI generation is logged** to `ai_generation_logs` (operation, user_id, input, output, tokens, latency)
- **Profile snapshots stored** in `user_roadmaps` at generation time for auditability
- **Git history** follows phase-based commit structure
- **`verified_at` + `source_url`** on every content row
- **Sentry** in both backends (planned) for error tracking with source maps
- **Structured logging** with NestJS Logger and Python `logging` — correlation IDs in production

---

## API Reference

### NestJS Public API (`:3001`)

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /auth/register | Public | Register user |
| POST | /auth/login | Public | Authenticate |
| POST | /auth/refresh | Public | Refresh token |
| GET | /auth/me | JWT | Current user |
| GET | /profiles/me | JWT | Get profile |
| POST | /profiles | JWT | Create profile (onboarding) |
| PATCH | /profiles/me | JWT | Update profile (invalidates roadmap) |
| DELETE | /profiles/me | JWT | GDPR erasure |
| GET | /roadmap | JWT | Get active roadmap |
| POST | /roadmap/generate | JWT | Generate roadmap |
| PATCH | /roadmap/steps/:slug/complete | JWT | Complete step |
| GET | /roadmap/progress | JWT | Progress stats |
| GET | /documents/checklist | JWT | Full document checklist |
| GET | /documents/checklist/:step_slug | JWT | Per-step checklist |
| GET | /health | Public | Liveness probe |

### FastAPI Internal API (`:8000`) — private network only

All endpoints except `/health` require `X-Internal-Key` header.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /roadmap/generate | Hybrid DB + AI roadmap generation |
| POST | /ai/chat | RAG-powered chat |
| POST | /ai/explain-field | Form field explanation |
| POST | /ai/appointment-email | German appointment email |
| POST | /rules/compute-deadlines | Deadline calculation |
| POST | /rules/validate-sequence | Dependency validation |
| GET | /rules/offices/:bundesland | Office contact details |
| GET | /health | Liveness probe |

OpenAPI spec auto-generated at `http://localhost:8000/docs` (dev only).

---

## Database Schema

PostgreSQL via Supabase (EU Frankfurt). Row-level security on all user tables.

- **Core:** `users`, `user_profiles`, `user_roadmaps`
- **Content (public read, admin write):** `roadmap_steps`, `document_requirements`, `forms`
- **AI/Audit:** `ai_conversations`, `ai_generation_logs`, `ai_feedback`

### Seed Data

| Bundesland | Student Visa | Work Permit |
|-----------|-------------|-------------|
| Bavaria (DE-BY) | ✅ | ✅ |
| Berlin (DE-BE) | ✅ | ✅ |
| NRW (DE-NW) | ✅ | ✅ |

11 roadmap steps, ~40 document requirements covering the full onboarding journey.

---

## Security

| Control | Implementation |
|---------|----------------|
| Authentication | Supabase JWT (1 h access, 7 d refresh) |
| Authorisation | Row-Level Security on all user tables |
| Internal API | Shared-secret `X-Internal-Key` header, private DNS |
| HTTP headers | Helmet (CSP, HSTS, X-Frame-Options, Referrer-Policy) |
| Rate limiting | `@nestjs/throttler` (100/min public, 300/min auth) |
| Input validation | class-validator DTOs + Pydantic models |
| Secret management | `.env` gitignored; GitHub Secrets + Railway env |
| Data at rest | Supabase encrypted storage |
| Data in transit | TLS everywhere (Vercel + Railway managed) |
| GDPR erasure | CASCADE deletes via FK constraints |
| EU residency | Supabase Frankfurt region |
| AI audit | Every call logged, no PII stored |

---

## Testing

### Coverage

| Layer | Tests | Focus |
|-------|-------|-------|
| NestJS | 10 | Roadmap caching, Python fallback, progress calc, step completion dedup, NotFoundException |
| FastAPI | 16 | DB filtering (visa/Bundesland/nationality), Claude enrichment verified-field preservation, AI-suggested flagging, deadline parsing, PII stripping, audit logging, internal API key rejection |
| Frontend | planned | Vitest + React Testing Library |

### Running
```bash
turbo test                               # All
turbo test --filter=api-node             # NestJS
cd apps/api-python && pytest -v          # FastAPI
turbo test -- --coverage                 # Coverage report
```

---

## CI/CD

| Workflow | Trigger | Actions |
|----------|---------|---------|
| `ci.yml` | PR to main/develop | Lint, test, build all workspaces |
| `deploy-staging.yml` | Push to develop | Vercel preview + Railway staging |
| `deploy-prod.yml` | Push to main | Vercel prod + Railway prod |

### Git Workflow
```
main (protected)          ← production deploys via PR
└── develop              ← staging deploys, daily work
    └── feature/*         ← optional for complex features
```

---

## Roadmap

### MVP (Phase 1 — complete)
- Situation Profiler, Personalised Roadmap, Document Checklist, Progress Tracker

### Phase 2 (post-semester)
- Flutter mobile (iOS + Android)
- AI Guidance Chat (RAG over full knowledge base)
- Form-Filling Guide, Appointment Email Generator, Deadline Alerts (Web Push)
- Community layer — verified tips from peers
- Document scanner with OCR + AI validation
- Lawyer connect — in-app referral, revenue share
- B2B institutional dashboards — cohort analytics
- Full 16-Bundesland coverage

---

## Target Users

- **Non-EU international students** in Germany (400,000+)
- **Skilled workers** on non-EU visas (300,000+)
- **B2B:** Universities (white-label per-student licence), Employers (onboarding tool)

### Initial markets
Bavaria, Berlin, North Rhine-Westphalia — ~60% of Germany's international population.

---

## License

Proprietary. All rights reserved.

## Course

Digital Product Development 26S — TH Deggendorf (European Campus), March–July 2026.
