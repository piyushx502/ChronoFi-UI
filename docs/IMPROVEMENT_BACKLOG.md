# ChronoFi — Unified Improvement Backlog

This backlog catalogs and prioritizes all engineering tasks, bug fixes, architecture improvements, feature discoveries, and maintenance actions for ChronoFi.

---

## Priority Taxonomy

- **P0:** Security vulnerabilities, data loss, broken builds, or critical correctness issues.
- **P1:** Important broken workflows, data-integrity problems, or high-impact improvements.
- **P2:** Valuable functionality, maintainability, and user experience improvements.
- **P3:** Optional experiments, low-priority enhancements, and aesthetic polish.

---

## 1. Critical Bugs & Data-Integrity Risks (P0)

| Task ID | Title | Status | Complexity | Dependencies |
| :--- | :--- | :---: | :---: | :--- |
| **BUG-001** | Fix Corrupted Currency Character Encoding in Tax Planner (`?4L` $\rightarrow$ `₹4L`) | **Completed** | Low | None |
| **BUG-002** | Migrate Pydantic v1 `class Config` to Pydantic v2 `ConfigDict` across all API Schemas | **Completed** | Low | None |
| **BUG-003** | Fix Import Order Bug in `models/schemas.py` (`Optional` referenced before import) | **Completed** | Low | None |
| **BUG-004** | Fix Deprecated `datetime.utcnow()` with Timezone-Aware `datetime.now(timezone.utc)` | **Completed** | Low | None |
| **BUG-005** | Fix Starlette Deprecation Warning `HTTP_422_UNPROCESSABLE_ENTITY` in Scenario Routes | **Completed** | Low | None |

### Detailed Specifications
- **[BUG-001] Fix Corrupted Currency Symbols in Tax Planner:**
  - *Rationale:* `NEW_REGIME_SLABS` contained corrupted labels (`?4L - ?8L`) and input label contained `Gross Salary (?)`, creating broken UI rendering.
  - *Delivered:* Replaced with proper Unicode Indian Rupee symbol `₹` throughout `src/app/dashboard/tax/page.tsx`. Verified in build.
- **[BUG-002 & BUG-003] Pydantic v2 ConfigDict & Import Ordering:**
  - *Rationale:* Class-based `Config` triggers PydanticDeprecatedSince20 warnings across 5 models; `Optional` was imported after class definitions on line 139.
  - *Delivered:* Migrated to `model_config = ConfigDict(from_attributes=True)` and consolidated typing imports at top of `models/schemas.py`.
- **[BUG-004] Timezone-Aware Datetime Migration:**
  - *Rationale:* `datetime.utcnow()` is deprecated in Python 3.12+ and scheduled for removal.
  - *Delivered:* Updated `core/security.py` to use `datetime.now(timezone.utc)`.
- **[BUG-005] FastAPI/Starlette 422 Status Constant:**
  - *Rationale:* `status.HTTP_422_UNPROCESSABLE_ENTITY` is deprecated in Starlette.
  - *Delivered:* Migrated to `status.HTTP_422_UNPROCESSABLE_CONTENT` in `api/scenario_routes.py`.

---

## 2. Git Synchronization & Integration Issues (P1)

| Task ID | Title | Status | Complexity | Dependencies |
| :--- | :--- | :---: | :---: | :--- |
| **GIT-001** | Synchronize Local Branches with Upstream Fetch References | **Completed** | Low | Git Remote |
| **GIT-002** | Reconcile Divergence Between `feature/continuous-improvement-loop` and `origin/main` | **Completed** | Low | `origin/main` |
| **GIT-003** | Integrate Teammate WebSocket PRs from Backend `origin/master` into Feature Branch | **Pending** | Medium | `origin/master` |

### Detailed Specifications
- **[GIT-001] Git Fetch & Reference Audit:**
  - *Rationale:* Ensured all remote tracking branches and tags are fetched without destructive overrides (`git fetch --all --tags --prune`).
  - *Status:* Both frontend and backend feature branches are 100% up-to-date with their respective remote tracking branches.
- **[GIT-002] Upstream Reconciliation Analysis:**
  - *Rationale:* `origin/main` in frontend merged PR #3 (`3045b1e`), which introduced zero code diff from `70d063f`. Our local branch has 7 clean forward commits ahead of `70d063f`.
  - *Acceptance Criteria:* Documented clean fast-forward compatibility; zero conflicts present.
- **[GIT-003] Backend WebSocket PR Integration:**
  - *Rationale:* Teammates added `api/websocket_routes.py`, `ai/background_graph.py`, and `tasks/monitor.py` in `origin/master` (PR #24, #25, #26, #28).
  - *Acceptance Criteria:* Fast-forward merge `origin/master` into `feature/continuous-improvement-loop` when authorized, mount routes in `main.py`, and verify test suite.

---

## 3. Safe Code Cleanup (P1 / P2)

| Task ID | Title | Status | Complexity | Dependencies |
| :--- | :--- | :---: | :---: | :--- |
| **CLN-001** | Remove Unused Imports Across 9 Frontend Components | **Completed** | Low | Frontend Codebase |
| **CLN-002** | Update Default Next.js Layout Title and Description Metadata | **Completed** | Low | `layout.tsx` |
| **CLN-003** | Flag Obsolete `chronofi-frontend/` and `node/` Folders for Deletion | **Completed** | Low | Code Review |
| **CLN-004** | Flag Temporary `patch_supervisor.py` Script for Removal | **Completed** | Low | Backend Codebase |

### Detailed Specifications
- **[CLN-001] Frontend Unused Imports Cleanup:**
  - *Delivered:* Removed unused imports from `not-found.tsx` (`Link`), `page.tsx` (`ShieldAlert`, `CreditCard`, `Activity`), `simulations/page.tsx` (`Sparkles`), `models/page.tsx` (`LineChart`, `Cpu`, `ShieldCheck`, `GitBranch`, `Binary`, `Layers`), `transcripts/page.tsx` (`ExternalLink`, `Sparkles`), `AIChat.tsx` (trailing comma `Bot,`), `DebtPayoffOptimizer.tsx` (`DollarSign`), `FinancialHealthMonitor.tsx` (`AlertCircle`, `CheckCircle2`, `AlertTriangle`), `StressTester.tsx` (`TrendingDown`). Verified via `npx tsc --noEmit` and `npm run lint`.
- **[CLN-002] Layout Branding Metadata:**
  - *Delivered:* Replaced `"Create Next App"` with `"ChronoFi — Autonomous Life Financial Planner"` in `src/app/layout.tsx`.

---

## 4. Architecture & Maintainability Improvements (P2)

| Task ID | Title | Status | Complexity | Dependencies |
| :--- | :--- | :---: | :---: | :--- |
| **ARC-001** | Consolidate Repository Pattern Abstractions (`models/repositories.py`) | **Planned** | Medium | `repositories/base.py` |
| **ARC-002** | Decouple Monte Carlo Solvers (`engine/monte_carlo.py` vs `scenario_engine.py`) | **Planned** | Low | `test_engine.py` |
| **ARC-003** | Implement Structured Logging with Correlation IDs Across Route Handlers | **Planned** | Medium | FastAPI Middleware |

---

## 5. Existing Features That Need Completion (P1 / P2)

| Task ID | Title | Status | Complexity | Dependencies |
| :--- | :--- | :---: | :---: | :--- |
| **FEAT-001** | Capital Gains (LTCG/STCG) Goal Decumulation UI in Tax Planner | **Completed** | Medium | `engine/tax_drawdown.py` |
| **FEAT-002** | Mount WebSocket Alerts Route in Backend `main.py` | **Planned** | Low | `websocket_routes.py` |
| **FEAT-003** | Frontend Real-Time WebSocket Toast Notification Listener | **Planned** | Medium | `FEAT-002` |
| **FEAT-004** | Turn `test_ml_inference.py` and `test_monte_carlo.py` into Formal Assertion Tests | **Planned** | Low | Pytest Suite |

### Detailed Specifications
- **[FEAT-001] Capital Gains Decumulation UI Integration:**
  - *Rationale:* Backend implemented `engine/tax_drawdown.py` and `/api/tax/goal-drawdown` under Finance Act 2024 rules, but the frontend Tax Planner only supported basic income tax slab calculation.
  - *Delivered:* Added dual-mode tab switcher in `src/app/dashboard/tax/page.tsx` with interactive goal decumulation calculator, asset class allocation sliders (Equity, Debt, Tax-Exempt), gross-up target calculation, asset tier breakdown table, and actionable tax-loss harvesting strategies.
  - *Verification:* Verified with `npx tsc --noEmit` and `npm run build` (10/10 static pages generated).

---

## 6. New Product Features (P2 / P3)

| Task ID | Title | Priority | Status | Complexity |
| :--- | :--- | :---: | :---: | :--- |
| **PROD-001** | CAMS / KFintech Consolidated Account Statement (CAS) PDF Ingestion | P2 | Researched | High |
| **PROD-002** | Dynamic Glide-Path Asset Allocation & Lifecycle De-Risking | P2 | Researched | Medium |
| **PROD-003** | Year-End Tax-Loss Harvesting & Cost-Basis Reset Engine | P2 | Researched | Medium |
| **PROD-004** | RBI Account Aggregator (AA) Consent-Driven Ingestion Protocol | P3 | Researched | High |

---

## 7. Testing, Security & Performance (P1 / P2)

| Task ID | Title | Status | Complexity | Dependencies |
| :--- | :--- | :---: | :---: | :--- |
| **TEST-001** | Convert `scripts/evaluate_rag.py` into Automated CI Regression Test Suite | **Planned** | Low | `pytest` |
| **TEST-002** | Comprehensive End-to-End Cypress / Playwright Flow for Simulation Studio | **Planned** | Medium | Next.js Frontend |
| **PERF-001** | Vector Store In-Memory Index Caching for High-Frequency User Queries | **Planned** | Medium | `engine/vector_store.py` |
| **SEC-001** | Refresh Token Rotation and Secure HTTP-Only Cookie Support | **Planned** | Medium | `api/auth_routes.py` |
