# ChronoFi — Changelog

All notable changes, fixes, and architectural enhancements executed in this repository session are documented below.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and adheres to semantic versioning principles.

---

## [Unreleased] - 2026-10-15

- **Personal Tab Layout Organization & Enhanced Edit Dialog**:
  - Organized the `Personal` section into 3 clean, balanced semantic sub-groups:
    1. **Demographics**: 4-column balanced card row for Full Legal Name, Verified Email (with Owner tag), Date of Birth & Age, and Occupation / Industry.
    2. **Preferences**: 2-column balanced 50/50 cards pairing the interactive `CurrencySwitcher` (with live rates & conversion) side-by-side with the `Risk Tolerance Profile` (with active stance badge, asset allocation narrative, and stochastic CRN engine alignment).
    3. **Account & Security**: 4-column balanced metadata row for Account ID, Member Since, Data Isolation (User Isolated), and Verification Status (Identity Verified).
  - Eliminated awkward grid gaps and dangling columns, achieving a structured, symmetrical card grid.
  - Enhanced the **Edit Personal Details** modal with bidirectional Date of Birth and Age calculation, read-only verified account identity display, Occupation input, Risk profile selection, and preferred display currency selector.
  - Added `date_of_birth` support across backend schemas (`UserProfileResponse`, `UserProfileUpdate`) and persistence in `chronofi-backend/api/profile_routes.py`.
  - Simplified the navigation pill label from `"Personal Info"` to `"Personal"` for consistency.

- **Profile Page Title Simplification & Typography-Driven Monochrome Unification**:

  - Simplified main page title to a single word: `Profile` (removed `"Financial Profile & Canonical Records"`).
  - Completely removed the `"Engine Synchronized"` status badge and the verbose management description subtitle.
  - Simplified all section titles to single clean words: `Personal`, `Income`, `Expenses`, `Assets`, `Liabilities`, `Goals`, and `Assumptions`.
  - Removed all long descriptive subtitles under each section title for a minimalist aesthetic.
  - Replaced multi-color accents (`emerald`, `rose`, `amber`, `blue`, `cyan`, `purple`, `indigo`) across section headers, badges, metric cards, checkboxes, and modals with ChronoFi's dark monochrome palette (`zinc-100` to `zinc-950`).
  - Established hierarchy and prominence solely using typography: font size scales (`text-2xl`, `text-lg`, `text-sm`, `text-xs`, `text-[10px]`), font weights (`font-bold`, `font-semibold`), font families (`font-mono` for figures and metrics), uppercase tracking, and clean neutral borders.

- **Global Currency Switcher with Live Reference Rates**:
  - Implemented backend dedicated `ExchangeRateService` in `chronofi-backend/engine/exchange_rate_service.py` with multi-provider integration (ExchangeRate-API open access primary, Frankfurter ECB reference rates fallback), 1-hour caching, in-flight request deduplication via `asyncio.Lock`, and decimal-safe cross conversions.
  - Added REST API routes in `chronofi-backend/api/rates_routes.py`:
    - `GET /api/rates/latest?base=INR`: live or cached exchange rates with provider attribution, exact timestamp, and staleness warnings.
    - `GET /api/rates/supported`: metadata for 9 supported ISO 4217 currencies (INR, USD, EUR, GBP, JPY, CAD, AUD, SGD, AED) with symbols and minor unit precisions.
    - `POST /api/rates/convert`: decimal-safe conversion endpoint.
  - Implemented global `CurrencyContext` and `useCurrency()` hook in `src/app/context/CurrencyContext.tsx` providing client-side cached rates, seamless decimal-safe conversion, dynamic locale formatting, and preference persistence.
  - Built interactive, searchable `CurrencySwitcher` component in `src/app/dashboard/components/CurrencySwitcher.tsx`:
    - Card variant embedded in the Profile tab's Personal Information section with currency details (Name, ISO 4217 code, Symbol), live rate exchange formula, freshness status, timestamp, and manual refresh trigger.
    - Header pill variant integrated in the top header for 1-click global switching.
    - Searchable dropdown popup with fuzzy search across currency names, codes, and symbols.
- **Sidebar Navigation Layout Refinement**:
  - Relocated `Profile` link out of top navigation items into the sidebar footer, positioned directly above `Disconnect`.
  - Removed the `Background` toggle button from the sidebar footer while preserving the animated currency matrix background in its default active mode.
  - Removed redundant currency changer pill from sidebar footer, retaining currency controls in the top header and within the Profile tab's Personal Information section.
  - Maintained Lucide icon consistency (`User`, `LogOut`) and full active-state route highlighting without any emojis.
  - Enforced strict financial data integrity:
    - Guaranteed zero mutation of underlying database records in `chronofi.db` during currency changes.
    - Preserved original transaction amounts and currency labels across assets, liabilities, expenses, and goals.
    - AnimatedCounter and dashboard KPI widgets dynamically convert from base transaction currency (`INR`) to the selected display currency.
  - Added comprehensive test suite in `chronofi-backend/tests/test_exchange_rates.py` covering supported currencies, decimal-safe arithmetic, JPY 0-minor-unit rounding, caching, stale offline fallbacks, and API routes.
- **Dedicated Profile Tab Implementation (`/dashboard/profile`)**:
  - Added dedicated `Profile` entry with `User` Lucide icon to navigation in `src/app/dashboard/layout.tsx`.
  - Built comprehensive, responsive Profile management page `src/app/dashboard/profile/page.tsx` covering all 8 functional sections:
    1. **Derived Overview**: Top-level summary cards for Net Worth, Total Assets, Total Liabilities, Monthly Inflow, Monthly Outflow, and Investable Surplus with Emergency Runway calculation.
    2. **Personal Information**: Viewing and editing of full name, verified email, calculated age & birth year, occupation, preferred currency (ISO 4217), account creation date, and risk tolerance profile.
    3. **Income Sources**: Full CRUD interface for recurring income streams with dynamic recurrence normalization (weekly, monthly, quarterly, annually) synchronized with quantitative planning engines.
    4. **Recurring Expenses**: Full CRUD interface for expenses with category classification, essential vs discretionary tags, and normalized living expenses breakdown.
    5. **Portfolio Assets**: Full CRUD interface for asset holdings, asset categories (cash, equity, real estate, gold, etc.), current valuations, and expected annual returns.
    6. **Liabilities & Debt Obligations**: Full CRUD interface for debt liabilities with APR interest rates, outstanding balances, and monthly EMI tracking.
    7. **Life Financial Goals**: Full CRUD interface for multi-tier milestone capital allocation goals (Essential, Important, Aspirational) with inflation-compounded target requirements.
    8. **Global Planning Assumptions**: Readout of quantitative simulation parameters (inflation rate, expected portfolio return, retirement age, Monte Carlo horizon).
  - Added dedicated modal dialogs with client-side validation, field boundaries, and destructive action deletion confirmation dialogs.
  - Implemented sticky quick-navigation section filter pills with dynamic count badges.
  - Removed lettered serialization prefixes (`A. `, `B. `, `C. `, etc.) and converted all section headings to prominent `text-base font-bold text-zinc-100` typography across `src/app/dashboard/profile/page.tsx`.
  - Maintained default `AnimatedBackground.tsx` currency precipitation stream exactly as designed.
- **Backend Profile Entity Update Endpoints (`chronofi-backend/api/profile_routes.py`)**:
  - Added `PUT /api/profile/assets/{asset_id}` supporting partial and full updates of asset holding values and categories.
  - Added `PUT /api/profile/liabilities/{liability_id}` supporting updates of loan balances, interest rates, and monthly payments.
  - Added `PUT /api/profile/goals/{goal_id}` supporting updates of milestone goals, target dates, and inflation priorities.
  - Added `AssetUpdate`, `LiabilityUpdate`, `GoalUpdate`, and extended `UserProfileResponse` with `occupation` and `created_at` in `chronofi-backend/models/schemas.py`.
  - Enforced strict user-isolation boundaries on all update endpoints (`where(Model.user_id == current_user.id)` with HTTP 404 on cross-user access attempts).
  - Added `test_update_financial_records_and_isolation` regression test in `chronofi-backend/tests/test_profile_crud.py`.
- **Explicit Profile Data Contract Reconciliation (Gate 4 & 5)**:
  - Enforced ISO 4217 `currency: str = Field(default="INR")` on `UserProfileResponse`, `AssetBase`, `LiabilityBase`, `GoalBase`, and child schemas in `chronofi-backend/models/schemas.py`.
  - Added strict non-negative validation constraints (`ge=0.0`) on monetary amounts (asset current value, liability principal/interest/payment, user salary/expenses) and `ge=1` on goal target years.
  - Aligned frontend TypeScript interfaces in [`FinancialProfile.tsx`](file:///c:/Users/Carcass/Documents/antigravity/bold-planck/src/app/dashboard/components/FinancialProfile.tsx) to support `currency?: string` on root and item levels.
  - Dynamized currency formatting in `formatCurrency` and `AnimatedCounter` to format according to the profile's active ISO currency.
  - Added HTML5 `min="0"` constraints and dynamic currency placeholders to asset, liability, and goal forms.
  - Added regression test `test_profile_contract_validation_and_currency` in `chronofi-backend/tests/test_profile_crud.py` to assert currency default presence and 422 Unprocessable Content rejection for invalid negative numbers.

### Fixed
- **Bcrypt Timing-Attack Dummy Hash (`chronofi-backend/api/auth_routes.py`)**:
  - Replaced invalid dummy string with a syntactically valid bcrypt hash string (`$2b$12$rsu...`) preventing unhandled 500 `ValueError: Invalid salt` when querying non-existent accounts, cleanly returning HTTP 401.
- **Financial Health Route Goal Attribute Access (`chronofi-backend/api/health_routes.py`)**:
  - Used `getattr()` for safe attribute extraction (`current_amount` and `title`/`name`) resolving 500 `AttributeError` on `/api/health/score`.
- **Financial Profile Instant URL Token Hydration (`src/app/dashboard/components/FinancialProfile.tsx`)**:
  - Added `getAuthToken()` fallback helper allowing direct URL query token authentication without race conditions against `layout.tsx` localStorage hydration.

### Verified
- **Frontend Typecheck (`npx tsc --noEmit`)**: 0 errors.
- **Frontend Lint (`npm run lint`)**: 0 warnings, 0 errors.
- **Frontend Production Build (`npm run build`)**: 10/10 static pages generated successfully.
- **Backend Test Suite (`uv run pytest`)**: 111 passed, 0 failures (100% pass rate).
- **Live Visual Verification**: Verified on `http://localhost:3000/dashboard` with Playwright Edge headless capture confirming profile, assets, liabilities, and goals rendering with clean dark terminal glass and active background currency animation.
  - Added dual-mode tab switcher in the Tax Planner between Section 115BAC Income Tax (New vs Old Regime) and Finance Act 2024 Capital Gains Decumulation.
  - Implemented interactive parameter inputs for goal horizon, target amount, gross projected corpus, total principal invested, and multi-asset allocation sliders (Equity, Debt, Tax-Exempt).
  - Integrated with backend `/api/tax/goal-drawdown` endpoint.
  - Displays pre-tax vs post-tax in-hand corpus, effective tax drag percentage, gross-up target corpus required to offset taxes, full asset class taxation breakdown table, and actionable tax-loss harvesting strategies.
- **Visual Consistency & Surface Harmonization (Gate 4 Batch 1 & 2)**:
  - Harmonized card surface tokens (`bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60`) and button interaction feedback (`active:scale-[0.99] transition-all`) across `FinancialProfile.tsx`, `AIChat.tsx`, `StressTester.tsx`, `DebtPayoffOptimizer.tsx`, and `FinancialHealthMonitor.tsx`.
  - Harmonized form input surfaces and focus rings (`bg-zinc-900/80 border border-zinc-800 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50` and scenario-accent equivalents).
  - Preserved default `AnimatedBackground.tsx` currency matrix background invariant without regression.
- **Comprehensive Documentation Suite (`docs/`)**:
  - `docs/REPOSITORY_AUDIT.md`: Complete audit of architecture, entry points, data models, quantitative engines, and security boundaries.
  - `docs/CODE_REVIEW_CANDIDATES.md`: 10-item code review candidate inventory classified into `SAFE_TO_REMOVE`, `KEEP_AND_FIX`, `POTENTIAL_REUSE`, `FUTURE_EXTENSION`, `EXPERIMENTAL`, and `DUPLICATE`.
  - `docs/FEATURE_RESEARCH.md`: In-depth research on 5 high-impact feature opportunities (CAS Ingestion, Proactive WebSocket Alerts, Dynamic Glide Paths, Tax-Loss Harvesting, and RBI Account Aggregator protocol) with 10 structured evaluation dimensions each.
  - `docs/IMPROVEMENT_BACKLOG.md`: Unified, prioritized task backlog covering P0 bugs, P1 git/feature workflows, P2 architecture/maintainability, and P3 experiments.
  - `docs/CHANGELOG.md`: Historical record of all changes made across frontend and backend repositories.

### Fixed
- **Corrupted Currency Characters in Tax Planner (`src/app/dashboard/tax/page.tsx`)**:
  - Replaced corrupted `?4L` strings across `NEW_REGIME_SLABS` and `Gross Salary (?)` label with proper Unicode Rupee symbols (`₹4L`, `₹4L - ₹8L`, `Gross Salary (₹)`).
- **Pydantic v2 ConfigDict Deprecations (`chronofi-backend/models/schemas.py`)**:
  - Replaced deprecated Pydantic v1 `class Config: from_attributes = True` with `model_config = ConfigDict(from_attributes=True)` across `AssetResponse`, `LiabilityResponse`, `GoalResponse`, `UserProfileResponse`, and `ConversationThreadResponse`.
  - Fixed import order bug where `Optional` was referenced in `UserProfileUpdate` before being imported on line 139; consolidated typing imports at top of file.
- **Timezone-Aware UTC Datetime Migration (`chronofi-backend/core/security.py`)**:
  - Replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)` in JWT access token expiration generation.
- **Starlette / FastAPI Status Constant Deprecation (`chronofi-backend/api/scenario_routes.py`)**:
  - Replaced deprecated `status.HTTP_422_UNPROCESSABLE_ENTITY` with `status.HTTP_422_UNPROCESSABLE_CONTENT`.
- **Default Metadata in Next.js Root Layout (`src/app/layout.tsx`)**:
  - Replaced boilerplate `"Create Next App"` metadata with institutional title `"ChronoFi — Autonomous Life Financial Planner"` and descriptive summary.
  - Reordered `AnimatedBackground` import to top of file with other module imports.

### Removed
- **Elimination of Unicode Emojis in Favor of Lucide Icons**:
  - Replaced OS-dependent emoji arrows (`↗`) on "Simulation Studio" and "Launch Simulation Studio" buttons in [`src/app/dashboard/page.tsx`](file:///c:/Users/Carcass/Documents/antigravity/bold-planck/src/app/dashboard/page.tsx) and [`src/app/dashboard/models/page.tsx`](file:///c:/Users/Carcass/Documents/antigravity/bold-planck/src/app/dashboard/models/page.tsx) with Lucide `<ArrowUpRight className="w-3.5 h-3.5" />`.
  - Replaced text emojis (`✓` and `⚠`) in Goal post-tax status in [`src/app/dashboard/tax/page.tsx`](file:///c:/Users/Carcass/Documents/antigravity/bold-planck/src/app/dashboard/tax/page.tsx) with Lucide `<CheckCircle2 />` and `<AlertTriangle />`.
- **Unused Frontend Imports & Syntax Cleanups**:
  - `src/app/not-found.tsx`: Removed unused `Link` import.
  - `src/app/dashboard/page.tsx`: Removed unused `ShieldAlert`, `CreditCard`, and `Activity` icon imports.
  - `src/app/dashboard/simulations/page.tsx`: Removed unused `Sparkles` icon import.
  - `src/app/dashboard/models/page.tsx`: Removed unused `LineChart`, `Cpu`, `ShieldCheck`, `GitBranch`, `Binary`, and `Layers` icon imports.
  - `src/app/dashboard/transcripts/page.tsx`: Removed unused `ExternalLink` and `Sparkles` icon imports.
  - `src/app/dashboard/components/AIChat.tsx`: Removed trailing comma in `import { Send, Bot, }`.
  - `src/app/dashboard/components/DebtPayoffOptimizer.tsx`: Removed unused `DollarSign` icon import.
  - `src/app/dashboard/components/FinancialHealthMonitor.tsx`: Removed unused `AlertCircle`, `CheckCircle2`, and `AlertTriangle` icon imports.
  - `src/app/dashboard/components/StressTester.tsx`: Removed unused `TrendingDown` icon import.

### Verified
- **Frontend Typecheck (`npx tsc --noEmit`)**: 0 errors.
- **Frontend Lint (`npm run lint`)**: 0 warnings, 0 errors.
- **Frontend Production Build (`npm run build`)**: 10/10 static pages generated successfully.
- **Backend Test Suite (`uv run pytest`)**: 110 passed across 25+ test suites, deprecation warnings reduced from 43 to 6.
