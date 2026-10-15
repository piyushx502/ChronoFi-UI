# ChronoFi — Code Review Candidates & Preservation Decisions

This document catalogs code artifacts, modules, experimental scripts, and architectural abstractions identified during the codebase audit. Every item is evaluated for immediate utility, future value, redundancy, and technical debt, with an evidence-backed classification and actionable recommendation.

---

## Classification Taxonomy

- **SAFE_TO_REMOVE:** Proven unnecessary, superseded, or dead code. Safe to delete without functional risk.
- **KEEP_AND_FIX:** Valuable functionality with defects, deprecations, or incomplete integration.
- **POTENTIAL_REUSE:** Standalone utility or script that can be repurposed to solve another problem or enhance CI.
- **FUTURE_EXTENSION:** Valid architectural extension point or abstraction intended for anticipated product scale.
- **EXPERIMENTAL:** Prototype or machine-learning experiment worth preserving for research and retraining.
- **NEEDS_INVESTIGATION:** Code whose usage or business purpose cannot yet be established with certainty.
- **DUPLICATE:** Redundant implementation where a canonical version already exists.

---

## Candidate Inventory

### 1. `chronofi-frontend/` (Superseded Nested Folder)
- **Path:** `chronofi-frontend/` (root workspace)
- **Classification:** `SAFE_TO_REMOVE`
- **Current Behavior:** An obsolete nested clone of `ChronoFi-UI.git`. Git status inside this directory showed 30+ deleted files, an untracked `.next/` cache, `node_modules/`, and an uncommitted modified `tax/page.tsx` where animations had been stripped out.
- **Evidence:** The active Next.js frontend is located directly at the workspace root (`src/`, `package.json`, `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json`). Nothing in the repository or CI references `chronofi-frontend/`.
- **Why It Is Not Useful:** Consumes ~300MB of disk space in `.next` and `node_modules` caches and causes confusion during repository navigation.
- **Dependencies & Risks:** Zero. `.gitignore` already specifies `chronofi-frontend/`.
- **Recommended Action:** Safely remove the directory from the filesystem.
- **Priority:** P2

---

### 2. `node/` (Legacy Binary Directory)
- **Path:** `node/node-v20.12.2-win-x64/` (root workspace)
- **Classification:** `SAFE_TO_REMOVE`
- **Current Behavior:** Contains an empty `node_modules` folder inside an unzipped Node.js directory.
- **Evidence:** Neither local development scripts nor GitHub Actions (`.github/workflows/ci.yml`) reference this directory. CI uses `actions/setup-node@v4` with Node 20.
- **Why It Is Not Useful:** Dead disk clutter.
- **Dependencies & Risks:** Zero.
- **Recommended Action:** Delete `node/` directory.
- **Priority:** P3

---

### 3. `chronofi-backend/patch_supervisor.py` (One-Off Migration Script)
- **Path:** `chronofi-backend/patch_supervisor.py`
- **Classification:** `SAFE_TO_REMOVE`
- **Current Behavior:** A 65-line Python script that read `ai/supervisor.py` and applied string replacements to inject the `Document_Agent` into the LangGraph state machine.
- **Evidence:** `ai/supervisor.py` has long incorporated the `Document_Agent` directly, passes 100% of unit tests (`tests/test_supervisor.py`, `tests/test_langgraph_rag.py`), and is committed to git.
- **Why It Is Not Useful:** A temporary patch utility that served its purpose and now sits dormant in the backend root.
- **Dependencies & Risks:** Zero runtime or test dependencies.
- **Recommended Action:** Remove file from git tracking or move to `docs/archive/`.
- **Priority:** P2

---

### 4. `chronofi-backend/src/chronofi_backend/__init__.py` (uv init Scaffolding)
- **Path:** `chronofi-backend/src/chronofi_backend/__init__.py`
- **Classification:** `SAFE_TO_REMOVE`
- **Current Behavior:** 3-line file defining `def main() -> None: print("Hello from chronofi-backend!")`.
- **Evidence:** The backend application is served from `chronofi-backend/main.py` (`uvicorn main:app`). All real code lives under `api/`, `core/`, `engine/`, `models/`, and `ai/`.
- **Why It Is Not Useful:** Scaffolding leftover from initial `uv init`.
- **Dependencies & Risks:** `pyproject.toml` lists `chronofi-backend = "chronofi_backend:main"` under `[project.scripts]`. Removing this entry and the directory cleans the project structure.
- **Recommended Action:** Update `pyproject.toml` and remove `chronofi-backend/src/`.
- **Priority:** P3

---

### 5. `chronofi-backend/models/repositories.py` & `chronofi-backend/repositories/base.py` (Repository Pattern)
- **Path:** `chronofi-backend/models/repositories.py` (`UserRepository`, `GoalRepository`) and `chronofi-backend/repositories/base.py` (`BaseRepository[T]`)
- **Classification:** `FUTURE_EXTENSION`
- **Current Behavior:** Provides generic async CRUD abstractions (`get_by_id`, `get_all`, `create`, `delete`) using SQLAlchemy AsyncSession.
- **Evidence:** Route handlers currently execute queries inline (`await db.execute(select(User)...)`). No route imports or uses `UserRepository` or `BaseRepository`.
- **Why It Is Useful:** Clean repository patterns allow seamless unit testing with in-memory repository fakes, decoupling route handlers from SQLAlchemy query syntax as the application grows to 50+ models.
- **Dependencies & Risks:** Low risk. Clean async implementation.
- **Recommended Action:** Keep both files intact. When refactoring database operations for multi-tenant isolation or microservices, migrate route handlers to utilize these repositories.
- **Priority:** P2

---

### 6. `chronofi-backend/test_ml_inference.py` & `test_monte_carlo.py` (Benchmark Scripts)
- **Path:** `chronofi-backend/test_ml_inference.py`, `chronofi-backend/test_monte_carlo.py`
- **Classification:** `KEEP_AND_FIX`
- **Current Behavior:** Standalone execution scripts measuring inference duration and printing percentiles for PyTorch LSTM and Monte Carlo engines. Pytest runs them because their file names match `test_*.py`, but they lack assertions.
- **Evidence:** Both scripts pass pytest by exiting without exception, but provide zero regression assertions on returned numerical outputs.
- **Why It Is Useful:** Excellent latency and sanity benchmarks for quantitative engines.
- **Dependencies & Risks:** `torch`, `numpy`, `engine/ml_forecaster.py`, `engine/monte_carlo.py`.
- **Recommended Action:** Add proper assertions (`assert 0 <= result["probability_of_success_percent"] <= 100`, `assert result["expected_50th_percentile"] > 0`) and move into `tests/test_benchmarks.py`, or relocate to `scripts/benchmarks/`.
- **Priority:** P2

---

### 7. `chronofi-backend/scripts/evaluate_rag.py` (Programmatic RAG Evaluator)
- **Path:** `chronofi-backend/scripts/evaluate_rag.py`
- **Classification:** `POTENTIAL_REUSE`
- **Current Behavior:** Evaluates the `Document_Agent` against a 5-query dataset covering retrieval threshold rejection, grounded facts, and mandatory citation formats (`[Filename, Page X]`).
- **Evidence:** Runs standalone with mocked vector store chunks and LLM outputs, calculating Grounding Accuracy (100%) and Citation Accuracy (100%).
- **Why It Is Useful:** Can be converted into a CI regression gate (`tests/test_rag_evaluator.py`) to prevent prompt drift or regressions in hallucination rejection.
- **Dependencies & Risks:** `langchain_core`, `ai/supervisor.py`.
- **Recommended Action:** Add to CI workflow as a test suite so that any modification to `document_agent_prompt` automatically validates citation compliance.
- **Priority:** P2

---

### 8. `chronofi-backend/ml/train.py` (LSTM Retraining Pipeline)
- **Path:** `chronofi-backend/ml/train.py`
- **Classification:** `EXPERIMENTAL`
- **Current Behavior:** Trains `ChronoFiLSTM` with PyTorch using simulated geometric Brownian motion return series, saving model weights to `chronofi_lstm.pth` and fitted scaler to `scaler.pkl`.
- **Evidence:** Not executed during API runtime; serves as the offline ML training pipeline.
- **Why It Is Useful:** Provides the exact architecture to retrain ChronoFi's deep learning sequence model on real historical Indian equity indices (NIFTY 50, S&P BSE SENSEX) and inflation data from RBI.
- **Dependencies & Risks:** `torch`, `scikit-learn`, `numpy`.
- **Recommended Action:** Preserve in `ml/` and document the training data schema for production retraining.
- **Priority:** P2

---

### 9. Proactive Autonomous Alerts via WebSockets & Background Graph
- **Path:** `chronofi-backend/ai/background_graph.py`, `api/websocket_routes.py`, `tasks/monitor.py` (on `origin/master`)
- **Classification:** `KEEP_AND_FIX`
- **Current Behavior:** Implements a headless LangGraph evaluator (`BackgroundEvaluatorState`) and a FastAPI WebSocket ConnectionManager (`/ws/alerts/{client_id}`) to push proactive Section 80C tax deduction deadline alerts to connected clients.
- **Evidence:** Added by contributors on backend `origin/master`, but not yet mounted into `main.py` nor wired into the frontend UI.
- **Why It Is Useful:** Transforms ChronoFi from a reactive query-response tool into an autonomous proactive financial copilot.
- **Dependencies & Risks:** LangGraph, FastAPI WebSockets, Gemini API key.
- **Recommended Action:** Mount `websocket_routes` in `main.py`, integrate with feature branch, and build a WebSocket alert listener in the frontend dashboard navbar.
- **Priority:** P1

---

### 10. `engine/monte_carlo.py` vs `engine/scenario_engine.py` (Monte Carlo Solvers)
- **Path:** `chronofi-backend/engine/monte_carlo.py` vs `chronofi-backend/engine/scenario_engine.py`
- **Classification:** `DUPLICATE`
- **Current Behavior:** `monte_carlo.py` implements an independent stochastic SIP simulator (`run_monte_carlo_sip`), whereas `scenario_engine.py` implements Common Random Numbers (CRN) paired simulation (`simulate_scenario_impact`).
- **Evidence:** `api/scenario_routes.py` uses `scenario_engine.py` exclusively. `monte_carlo.py` is only exercised by legacy tests (`test_engine.py`, `test_monte_carlo.py`).
- **Why It Is Useful / Redundant:** `scenario_engine.py` is strictly superior because CRN guarantees that variance between baseline and scenario is 100% causal and not statistical noise.
- **Dependencies & Risks:** `test_engine.py` asserts against `run_monte_carlo_sip`.
- **Recommended Action:** Designate `scenario_engine.py` as the canonical simulation engine; retain `monte_carlo.py` as a standalone mathematical benchmark for single-path SIP analysis.
- **Priority:** P3
