# ChronoFi — Comprehensive Repository Audit

## 1. Executive Summary & Audit Scope

ChronoFi is an institutional-grade, AI-powered life financial planning platform. It pairs conversational natural language intelligence (LangGraph multi-agent orchestration, Gemini models, vector retrieval) with deterministic, mathematically verifiable financial modeling (Common Random Numbers Monte Carlo simulation, multi-goal priority waterfall allocation, loan amortization, 4-tier liquidation stress testing, and Indian tax code optimization).

This audit evaluates the architecture, codebase organization, dependencies, test coverage, security boundaries, and code quality across both the frontend (`ChronoFi-UI.git`) and backend (`ChronoFi.git`) repositories.

---

## 2. Repository Structure & Dual-Repository Architecture

The project is structured as a dual-repository system:
1. **Frontend Repository (`ChronoFi-UI.git` / root workspace `bold-planck`)**:
   - Next.js 14 App Router, TypeScript 5, Tailwind CSS, Framer Motion, Recharts, Microsoft Fetch Event Source.
   - Houses the user-facing web terminal, simulation studio, interactive financial profile, charts, and conversational interface.
2. **Backend Repository (`ChronoFi.git` / `chronofi-backend/`)**:
   - Python 3.14, FastAPI, SQLAlchemy 2.0 (Async), aiosqlite, LangGraph, LangChain, PyTorch, NumPy Financial, Scikit-Learn, PyMuPDF.
   - Houses deterministic financial mathematics, multi-agent AI routing, durable SQLite checkpointing, and RAG document intelligence.
3. **Legacy / Obsolete Nested Folders Identified**:
   - `chronofi-frontend/`: An obsolete, superseded checkout of `ChronoFi-UI.git` where all files had been deleted or moved to root, leaving untracked `.next`, `next-env.d.ts`, and `node_modules`.
   - `node/`: An unused directory containing only an empty `node-v20.12.2-win-x64/node_modules/` folder.

```
bold-planck/ [ChronoFi-UI.git]
├── .github/workflows/ci.yml         # GitHub Actions Frontend CI Pipeline
├── docs/                            # Architecture, decisions, backlog, audit docs
├── public/images/                   # Static assets (tuxedo cat, AI blink illustrations)
├── src/
│   ├── app/
│   │   ├── components/              # AnimatedBackground, InteractiveCat
│   │   ├── dashboard/
│   │   │   ├── components/          # AIChat, FinancialProfile, PredictiveChart,
│   │   │   │                        # ScenarioComparison, StressTester,
│   │   │   │                        # DebtPayoffOptimizer, FinancialHealthMonitor
│   │   │   ├── models/page.tsx      # Quantitative models and engine registry
│   │   │   ├── simulations/page.tsx # Dedicated 4-engine Simulation Studio
│   │   │   ├── tax/page.tsx         # Income tax (115BAC) & LTCG/STCG Decumulation
│   │   │   ├── transcripts/page.tsx # Thread history & Document Intelligence Vault
│   │   │   ├── layout.tsx           # Dashboard shell with responsive navigation
│   │   │   └── page.tsx             # Copilot Terminal (Profile, Chat, Simulator)
│   │   ├── fonts/                   # GeistVF & GeistMonoVF font binaries
│   │   ├── globals.css              # Custom styling, dark mode tokens, scrollbars
│   │   ├── layout.tsx               # Root layout, HTML head metadata, background
│   │   ├── not-found.tsx            # 404 error page with interactive parallax cat
│   │   ├── page.tsx                 # Authentication / Login landing page
│   │   └── template.tsx             # Page transition motion wrapper
│   └── lib/utils.ts                 # ClassName merger (clsx + twMerge)
└── chronofi-backend/ [ChronoFi.git]
    ├── ai/                          # LangGraph supervisor, scenario agent, background graph
    ├── api/                         # FastAPI route modules (auth, profile, tax, scenario, etc.)
    ├── core/                        # JWT security, checkpointer persistence, app config
    ├── engine/                      # CRN Monte Carlo, waterfall, stress, debt, tax drawdown
    ├── ml/                          # PyTorch LSTM weights, scaler, and training pipeline
    ├── models/                      # SQLAlchemy models, Pydantic schemas, database sessions
    ├── scripts/                     # Benchmark scripts (evaluate_rag.py)
    ├── seed/                        # Demo personas (Arjun & Priya) seed script
    ├── static/                      # Static HTML fallback (index.html)
    ├── tests/                       # Pytest test suite (110 passing tests)
    └── main.py                      # FastAPI application entry point
```

---

## 3. Git Status & Synchronization Audit

### Current Branch & Remote Tracking
- **Frontend (`bold-planck` / `ChronoFi-UI.git`)**:
  - Current Branch: `feature/continuous-improvement-loop`
  - Tracking Remote: `origin/feature/continuous-improvement-loop` (at commit `c90a139`)
  - Remote URL: `https://github.com/piyushx502/ChronoFi-UI.git`
  - Synchronization Status: Up-to-date with remote feature branch.
  - Upstream Status: `origin/main` is at `3045b1e` (Merge pull request #3 from `feature/audit-and-cashflow-profiling`). The merge commit introduced zero code diff from `70d063f`. Our local branch is branched from `70d063f` and has 7 forward commits implementing multi-goal waterfall UI, stress testing UI, debt payoff UI, health monitoring UI, document vault UI, and CI pipeline fixes.
- **Backend (`chronofi-backend` / `ChronoFi.git`)**:
  - Current Branch: `feature/continuous-improvement-loop`
  - Tracking Remote: `origin/feature/continuous-improvement-loop` (at commit `ebd68a4`)
  - Remote URL: `https://github.com/piyushx502/ChronoFi.git`
  - Synchronization Status: Up-to-date with remote feature branch.
  - Upstream Status: `origin/master` merged `feature/continuous-improvement-loop` via PR #24 (`02dfa8d`) and incorporated subsequent patches from teammates adding `ai/background_graph.py`, `api/websocket_routes.py`, and `tasks/monitor.py`.

---

## 4. Frontend Application Audit

### Application Entry Points & Navigation
1. **Root Layout (`src/app/layout.tsx`)**:
   - Fixed: Previously used default boilerplate metadata (`Create Next App`). Updated to institutional branding (`ChronoFi — Autonomous Life Financial Planner`).
   - Fixed: Re-ordered `AnimatedBackground` import to top of file.
2. **Authentication (`src/app/page.tsx`)**:
   - Authenticates against `/api/auth/token` via `application/x-www-form-urlencoded`.
   - Stores JWT token in `localStorage.getItem("token")`.
   - Supports shorthand usernames (`arjun` -> `arjun@chronofi.demo`).
3. **Dashboard Shell (`src/app/dashboard/layout.tsx`)**:
   - Navigation links: `Terminal`, `Simulations`, `Quant Models`, `AI Transcripts`, `Tax Planner`.
   - Interactive background switcher: toggles between Floating Currency Symbol Matrix and Minimal Radial Mesh, broadcasting custom DOM event `chronofi_bg_toggle`.
   - Route guard: redirects to `/` if no JWT token exists.
4. **Copilot Terminal (`src/app/dashboard/page.tsx`)**:
   - Clean single-row tab switcher: Quant Agent Chat vs What-If Simulator.
   - Quick launch pill for Simulation Studio.
   - Synchronized real-time chart updating dynamically on SSE chat tool events.
   - Cleaned: Removed unused `ShieldAlert`, `CreditCard`, `Activity` imports.
5. **Simulation Studio (`src/app/dashboard/simulations/page.tsx`)**:
   - 4 specialized quantitative engine tabs:
     1. What-If Scenario Simulator (CRN Monte Carlo)
     2. Liquidity Stress Tester (4-tier liquidation waterfall)
     3. Debt Payoff Accelerator (Avalanche vs Snowball)
     4. Financial Health Monitor (Composite 0-100 score)
   - Cleaned: Removed unused `Sparkles` import.
6. **Tax Planner (`src/app/dashboard/tax/page.tsx`)**:
   - Fixed: Corrupted currency symbols (`?4L` -> `₹4L`, `Gross Salary (?)` -> `Gross Salary (₹)`).
   - Added: Dual-mode tabs supporting Section 115BAC New vs Old Regime comparison AND Indian Capital Gains (Budget 2024 LTCG/STCG) Goal Decumulation & Drawdown.
7. **Document Intelligence Vault & Transcripts (`src/app/dashboard/transcripts/page.tsx`)**:
   - Document upload, deletion, status polling, and citation verification.
   - Thread list and message transcript viewer.
   - Cleaned: Removed unused `ExternalLink`, `Sparkles` imports.
8. **Error Pages & Visuals (`src/app/not-found.tsx`, `InteractiveCat.tsx`, `AnimatedBackground.tsx`)**:
   - Interactive 3D mouse parallax on sleeping tuxedo cat illustration.
   - Reduced motion accessibility fallback (`@media (prefers-reduced-motion: reduce)`).
   - Cleaned: Removed unused `Link` import from `not-found.tsx`.

---

## 5. Backend Application & API Audit

### Entry Points, Lifecycle, & Middleware
- **FastAPI Lifespan (`main.py`)**:
  - Automatically initializes SQLite tables via `conn.run_sync(Base.metadata.create_all)`.
  - Initializes durable checkpointer tables via `checkpointer.init_checkpointer()`.
  - Seeds database with Arjun and Priya personas if user table is empty.
  - Safely closes checkpointer on shutdown.
- **Server-Sent Events (SSE) Chat Stream (`/api/chat`)**:
  - Streams token-by-token LLM output (`on_chat_model_stream`).
  - Emits real-time tool logs (`on_tool_start`).
  - Emits structured JSON events when scenario engine runs (`on_tool_end` -> `scenario_result`).
  - Emits confirmed liability events (`liability_confirmed`).
  - Sends persistent `thread_id` on first event for session continuity.

### Core Engines & Calculation Logic
1. **Paired Monte Carlo (`engine/scenario_engine.py`)**:
   - Implements Common Random Numbers (CRN) using synchronized seeds across baseline and scenario runs.
   - Solves closed-form loan amortization: $\text{EMI} = P \cdot r \cdot \frac{(1+r)^n}{(1+r)^n - 1}$.
   - Evaluates CVaR (Conditional Value at Risk) at 10th percentile for Black Swan risk.
2. **Multi-Goal Priority Waterfall (`engine/scenario_engine.py`)**:
   - Allocates disposable surplus sequentially: `Essential` $\rightarrow$ `Important` $\rightarrow$ `Aspirational`.
   - Tracks deficit starvation, timeline delay months, and post-loan recovery compounding.
3. **Liquidity Stress Engine (`engine/stress_engine.py`)**:
   - Models job loss, income reduction, and medical shock scenarios.
   - 4-Tier liquidation waterfall:
     - Tier 1: Cash / Savings (0% penalty)
     - Tier 2: Fixed Deposits (1% premature withdrawal penalty)
     - Tier 3: Debt Mutual Funds (2% exit load & friction)
     - Tier 4: Equity Mutual Funds (15% fire-sale market impact haircut)
4. **Debt Payoff Engine (`engine/debt_engine.py`)**:
   - Compares Baseline vs Avalanche (APR descending) vs Snowball (Balance ascending).
   - Simulates extra monthly prepayments and lump-sum bonus injections.
5. **Capital Gains Decumulation Engine (`engine/tax_drawdown.py`)**:
   - Budget 2024 / Finance Act 2024 compliance:
     - Equity LTCG (>12 mo): 12.5% on gains exceeding ₹1.25 Lakh exemption.
     - Equity STCG (<=12 mo): 20%.
     - Debt Funds (Section 50AA): Marginal slab rate (default 30%).
     - Tax-Exempt (PPF/EPF): 0% tax.
     - 4% Health & Education Cess across all taxes.
   - Calculates target gross-up requirement to offset tax drag.
6. **Income Tax Engine (`engine/tax_calc.py`)**:
   - New Regime (FY 26-27): ₹75,000 standard deduction, 7 slabs, Section 156 (formerly 87A) rebate up to ₹60,000 for income $\le$ ₹12 Lakh, and marginal relief.
   - Old Regime: ₹50,000 standard deduction, Section 80C/80D deductions, agricultural income partial integration.

---

## 6. Deprecation & Correctness Fixes Executed

1. **Pydantic v2 ConfigDict Migration (`models/schemas.py`)**:
   - Replaced deprecated Pydantic v1 `class Config: from_attributes = True` across `AssetResponse`, `LiabilityResponse`, `GoalResponse`, `UserProfileResponse`, and `ConversationThreadResponse` with `model_config = ConfigDict(from_attributes=True)`.
   - Fixed import ordering: moved `from typing import Any, Dict, List, Optional` to top of file to prevent unimported `Optional` references in `UserProfileUpdate`.
2. **Timezone-Aware UTC Migration (`core/security.py`)**:
   - Replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)`.
3. **FastAPI / Starlette Status Constant (`api/scenario_routes.py`)**:
   - Replaced deprecated `status.HTTP_422_UNPROCESSABLE_ENTITY` with `status.HTTP_422_UNPROCESSABLE_CONTENT`.
4. **Frontend Currency Symbol Encoding (`src/app/dashboard/tax/page.tsx`)**:
   - Replaced corrupted `?4L` strings with proper Unicode Rupee symbols `₹4L`.
5. **Frontend Unused Imports Cleanup**:
   - Cleaned 15+ unused imports across 9 frontend components.

---

## 7. Verification Results

| Target | Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **Frontend Typecheck** | `npx tsc --noEmit` | **PASS (Code 0)** | 0 TypeScript errors |
| **Frontend Lint** | `npm run lint` | **PASS (Code 0)** | 0 ESLint errors or warnings |
| **Frontend Build** | `npm run build` | **PASS (Code 0)** | 10/10 static pages compiled successfully |
| **Backend Test Suite** | `uv run pytest` | **PASS (Code 0)** | 110/110 tests passed (warnings reduced from 43 to 6) |
