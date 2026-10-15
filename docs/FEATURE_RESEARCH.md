# ChronoFi — Product Research & Feature Opportunities

This document presents rigorous, evidence-based research into high-value product features, quantitative models, AI orchestration patterns, and integrations that can enhance ChronoFi as an institutional-grade, AI-powered life financial planning platform.

Every candidate is evaluated against the existing codebase architecture and documented across 10 structured dimensions with credible external references.

---

## Researched Domain Foundations & Reference Platforms

1. **Maybe Finance ([github.com/maybe-finance/maybe](https://github.com/maybe-finance/maybe))**:
   - *Key Insights*: Open-source personal wealth engine. Pioneered clean, transparent balance sheet tracking, transaction-level double-entry bookkeeping, and asset allocation visualization without hidden formulas.
2. **Actual Budget ([github.com/actualbudget/actual](https://github.com/actualbudget/actual))**:
   - *Key Insights*: Privacy-first, local-first envelope budgeting with client-side end-to-end encryption (E2EE) and CRDT-based multi-device synchronization.
3. **Firefly III ([github.com/firefly-iii/firefly-iii](https://github.com/firefly-iii/firefly-iii))**:
   - *Key Insights*: Self-hosted manager for personal finances. Demonstrates complex recurring rule engines, liability interest amortization, and cash-flow forecasting.
4. **Ghostfolio ([github.com/ghostfolio/ghostfolio](https://github.com/ghostfolio/ghostfolio))**:
   - *Key Insights*: Open-source wealth management platform utilizing modern quantitative metrics (Sharpe ratio, max drawdown, historical volatility) and multi-currency tracking.
5. **India Account Aggregator Ecosystem (RBI NBFC-AA / Sahamati ([sahamati.org.in](https://sahamati.org.in)))**:
   - *Key Insights*: Regulated, consent-based financial data-sharing protocol in India enabling tamper-proof retrieval of bank statements, mutual fund CAS (Consolidated Account Statements), and loan liabilities without scraping credentials.

---

## Evaluated Feature Candidates

---

### Feature 1: CAMS / KFintech Consolidated Account Statement (CAS) Automated Ingestion
*Automated multi-asset portfolio sync from password-protected Indian mutual fund statements.*

1. **User Problem:** Users currently must manually type each asset name, asset type, and current value into the Financial Profile modal. For users with 10-20 mutual funds or stocks, manual entry causes friction and leads to stale or inaccurate portfolio values.
2. **Real-World Use Case:** Arjun receives his monthly Consolidated Account Statement (CAS) PDF from CAMS/KFintech via email. He drags and drops the PDF into ChronoFi's Document Vault and enters his PAN/password. ChronoFi instantly parses all folio balances, asset classes (Large Cap, Mid Cap, Liquid, Debt), units held, NAV, and purchase dates, populating his living balance sheet in 3 seconds.
3. **Expected Benefit:** 95% reduction in onboarding friction; 100% accurate asset valuation and exact cost basis for subsequent capital gains drawdown calculations.
4. **How It Works:**
   - Frontend accepts the PDF and an optional statement unlock password.
   - Backend `pdf_processor.py` invokes `fitz.open(stream=..., filetype="pdf")` with `doc.authenticate(password)`.
   - Uses regex and structured tabular extraction (via PyMuPDF tables or Gemini 2.5 Flash with structured Pydantic schema) to extract scheme names, ISINs, folio numbers, units, purchase dates, and current valuation.
   - Upserts entries into `assets` table with `asset_type="Equity"` or `"Debt"` and stores purchase cost basis for LTCG tax tracking.
5. **Required System Changes:**
   - *Frontend:* Add statement password prompt modal to `TranscriptsAndDocumentsPage` upload dropzone.
   - *Backend:* Add `password: Optional[str]` to `POST /api/documents/upload` form; add CAS parser in `engine/pdf_processor.py`.
   - *Database:* Add `cost_basis: float`, `purchase_date: Optional[str]`, and `isin: Optional[str]` columns to `assets` table.
   - *AI:* Add CAS document prompt schema to `Document_Agent` for querying folio histories.
6. **Data Sources & Dependencies:** PyMuPDF (`fitz`), CAMS/KFintech CAS layout specifications, AMFI NAV daily feed.
7. **Implementation Complexity:** Medium (3-4 engineering days).
8. **Security & Financial Correctness Risks:** Password must never be stored in plaintext or logged; statement must be processed in memory and encrypted at rest.
9. **Relationship to Existing Functionality:** Feeds directly into `FinancialProfile.tsx`, `engine/scenario_engine.py`, and `engine/tax_drawdown.py`.
10. **Measurable Acceptance Criteria:** Successfully parses 5 sample password-protected CAS PDFs with 100% extraction accuracy of folio schemes, unit counts, and valuation.

---

### Feature 2: Proactive Autonomous Financial Event Alerts via WebSocket
*Continuous background monitoring for tax year-end deadlines, interest rate shifts, and emergency runway drops.*

1. **User Problem:** Financial planning platforms are traditionally passive dashboards that wait for the user to visit and query them. If a user has ₹50,000 unclaimed under Section 80C as March 31 approaches, or if an emergency expense drops their runway below 3 months, they receive no timely warning.
2. **Real-World Use Case:** Priya opens ChronoFi in late February. A subtle status pill in the top header pulses green: *"Tax Alert: ₹45,000 remaining in Section 80C limit before March 31st. Investing in ELSS or PPF will save up to ₹14,040 in slab taxes."* Clicking the alert opens the Tax Planner with prefilled inputs.
3. **Expected Benefit:** Shifts ChronoFi from a passive analytical tool to an autonomous proactive financial copilot, improving financial health and preventing missed tax optimization opportunities.
4. **How It Works:**
   - Headless LangGraph graph (`ai/background_graph.py`) consumes user portfolio state, pending 80C headroom, and fiscal calendar triggers.
   - Gemini models generate concise, personalized, deterministic-checked action items.
   - FastAPI WebSocket router (`api/websocket_routes.py`) manages concurrent active connections (`/ws/alerts/{client_id}`).
   - Frontend `DashboardLayout.tsx` establishes a persistent WebSocket connection and displays real-time toast alerts and a notification center.
5. **Required System Changes:**
   - *Frontend:* Add WebSocket hook `useWebSocketAlerts` in `DashboardLayout.tsx` and an alert drawer icon with unread badges.
   - *Backend:* Mount `api/websocket_routes.py` in `main.py`; connect `tasks/monitor.py` to FastAPI background task or cron.
   - *Database:* Add `notifications` table (`id`, `user_id`, `title`, `body`, `type`, `is_read`, `created_at`).
   - *AI:* Expand `ai/background_graph.py` with multi-event rules (Runway alert, High-interest debt warning, 80C deadline).
6. **Data Sources & Dependencies:** FastAPI WebSockets, LangGraph headless workflow, Indian Income Tax calendar.
7. **Implementation Complexity:** Low-to-Medium (1-2 engineering days; backend foundation already drafted in `origin/master`).
8. **Security & Financial Correctness Risks:** WebSocket channels must authenticate user identity via JWT token during connection handshake; no LLM arithmetic hallucination permitted in alert savings amounts.
9. **Relationship to Existing Functionality:** Integrates backend `api/websocket_routes.py` and `ai/background_graph.py` with frontend dashboard.
10. **Measurable Acceptance Criteria:** WebSocket client connects successfully upon login; background tax limit scan delivers notification within 500ms; toast dismisses gracefully.

---

### Feature 3: Dynamic Glide-Path Asset Allocation & Lifecycle De-Risking
*Automated shift from equity to debt as life goals approach maturity.*

1. **User Problem:** Users currently have static expected return rates and fixed equity/debt allocations. As a major life goal (e.g. Child Higher Education or Retirement) approaches within 2-3 years, keeping funds in high-volatility equities exposes the user to severe sequence-of-returns risk (e.g., a 25% market drawdown right when college tuition is due).
2. **Real-World Use Case:** Arjun has a 15-year goal for his child's college fund. In years 1-10, ChronoFi models an aggressive 80/20 equity/debt allocation. Starting at Year 11, the engine dynamically glides allocation to 60/40, then 40/60, reaching 10/90 in Year 15 to lock in capital gains and immunize against market crashes.
3. **Expected Benefit:** Protects life goals from timing risk and sequence-of-returns volatility, providing realistic risk-adjusted wealth paths.
4. **How It Works:**
   - Implement deterministic glide-path functions in `engine/scenario_engine.py`:
     $$\text{EquityPct}(t) = \text{InitialEquity} - (\text{InitialEquity} - \text{TerminalEquity}) \cdot \left(\frac{t}{T}\right)^\gamma$$
   - Vectorized simulation dynamically updates monthly return distributions and portfolio variance according to the glide path.
   - Compares static allocation vs glide-path allocation in What-If Simulator.
5. **Required System Changes:**
   - *Frontend:* Add Glide-Path visualization toggle to `PredictiveChart.tsx` and `ScenarioComparison.tsx`.
   - *Backend:* Update `engine/scenario_engine.py` to support time-varying return/volatility matrices.
   - *Database:* Add `use_glide_path: bool` and `terminal_equity_pct: float` to `goals` table.
   - *AI:* Add explanation of sequence-of-returns risk and glide-path de-risking in `ai/scenario_workflow.py`.
6. **Data Sources & Dependencies:** Modern Portfolio Theory (MPT), historical Indian equity and debt risk-return parameters.
7. **Implementation Complexity:** Medium (2-3 engineering days).
8. **Security & Financial Correctness Risks:** Strict mathematical validation required to avoid unrealistic risk penalties.
9. **Relationship to Existing Functionality:** Directly upgrades `engine/scenario_engine.py` and `PredictiveChart.tsx`.
10. **Measurable Acceptance Criteria:** Demonstrates lower CVaR (Conditional Value at Risk) at 10th percentile for glide-path paths compared to static 80% equity holding over 15-year horizons.

---

### Feature 4: Tax-Loss Harvesting & Capital Gains Rebalancing Engine
*Continuous identification of unrealized losses to offset taxable equity gains under Budget 2024.*

1. **User Problem:** Under India Finance Act 2024, equity LTCG above ₹1.25 Lakh is taxed at 12.5%, and STCG is taxed at 20%. Many retail investors fail to harvest tax losses or utilize their annual ₹1.25 Lakh exemption limit before March 31, paying unnecessary tax upon ultimate withdrawal.
2. **Real-World Use Case:** Before March 31, ChronoFi scans Arjun's mutual fund folios and identifies that he has realized only ₹40,000 in LTCG this fiscal year. The engine recommends redeeming and reinvesting ₹85,000 of gains from a large-cap fund to exhaust his ₹1.25L tax-free threshold, stepping up his cost basis and saving future taxes with zero net outlay.
3. **Expected Benefit:** Direct annual tax savings of up to ₹15,600/year (12.5% + 4% cess on ₹1.25L exemption), compounded over 20-30 years.
4. **How It Works:**
   - Ingests purchase dates and purchase NAVs from mutual fund holdings or user assets.
   - Analyzes STCL (Short-Term Capital Loss) and LTCL (Long-Term Capital Loss) offset rules under Section 70 and 71 of the Income Tax Act.
   - Recommends specific tax-gain harvesting (resetting cost basis up to ₹1.25L exemption) and tax-loss harvesting actions.
5. **Required System Changes:**
   - *Frontend:* Add Tax-Loss Harvesting card in `src/app/dashboard/tax/page.tsx`.
   - *Backend:* Add `/api/tax/harvesting-recommendations` endpoint in `api/tax_routes.py` backed by `engine/tax_drawdown.py`.
   - *Database:* Track acquisition date and purchase cost in `assets` table.
   - *AI:* Equip `Tax_Agent` in `ai/supervisor.py` with tax-harvesting recommendation tool.
6. **Data Sources & Dependencies:** Section 70/71 Income Tax Act 1961, Finance Act 2024 capital gains rules.
7. **Implementation Complexity:** Medium (3 engineering days).
8. **Security & Financial Correctness Risks:** Must respect 3-year loss carry-forward rules and prevent wash-sale violations.
9. **Relationship to Existing Functionality:** Extends `engine/tax_drawdown.py` and the newly enhanced `src/app/dashboard/tax/page.tsx`.
10. **Measurable Acceptance Criteria:** Accurately calculates optimal tax-gain harvesting amount without exceeding ₹1.25L annual exemption; generates validated recommendations.

---

### Feature 5: Multi-Account Aggregator (RBI AA) Consent-Driven Ingestion
*Secure, paperless bank statement and liability verification via Account Aggregator protocol.*

1. **User Problem:** Uploading bank statements as PDFs often requires redacting personal addresses or dealing with scanned image quality issues. Users want instant, tamper-proof account connection like UPI.
2. **Real-World Use Case:** Arjun clicks "Connect Bank Account" via Sahamati Account Aggregator (e.g. Setu, Finvu, or OneMoney). He receives an OTP on his mobile number, approves consent for reading monthly salary deposits and existing loan EMIs, and ChronoFi automatically synchronizes his base salary, living expenses, and outstanding loans.
3. **Expected Benefit:** 100% verified, bank-grade data integrity; zero manual entry errors; real-time EMI tracking.
4. **How It Works:**
   - Initiates consent request to licensed NBFC-AA gateway.
   - User approves consent artifact via mobile authentication.
   - AA delivers signed, encrypted Financial Information (FI) XML/JSON payload.
   - Backend decrypts FI using private key and parses deposits and debits into living cash-flow KPIs.
5. **Required System Changes:**
   - *Frontend:* Consent management UI with AA handles (e.g. `user@onemoney`).
   - *Backend:* AA webhook receiver and ECDH decryption module in `api/integration_routes.py`.
   - *Database:* Add `connected_institutions` table and `account_aggregator_consents` table.
   - *AI:* `Budgeting_Agent` queries verified transaction records for income verification.
6. **Data Sources & Dependencies:** RBI Master Direction - Non-Banking Financial Company - Account Aggregator (Reserve Bank) Directions, 2016; Sahamati API Specifications.
7. **Implementation Complexity:** High (6-8 engineering days; requires sandbox provider like Setu/Finvu).
8. **Security & Financial Correctness Risks:** End-to-end data encryption; strict compliance with Digital Personal Data Protection Act (DPDPA) 2023.
9. **Relationship to Existing Functionality:** Automates data population for `FinancialProfile.tsx` and `engine/health_engine.py`.
10. **Measurable Acceptance Criteria:** Successfully receives and decrypts simulated FI payload in sandbox environment; extracts salary and loans with zero data loss.
