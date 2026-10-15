# ChronoFi — Profile Data Field Definitions & Schema Reconciliation Audit

## 1. Executive Summary

This document reconciles the **Logical Data Contract** specified in the *Explicit Profile Data Field Definitions* against the physical database schemas, Pydantic request/response models, financial computation engines, and frontend TypeScript interfaces of the ChronoFi platform.

In accordance with **Implementation Rule 1** and **Gate 1 Approval Rules**, this audit:
1. Reuses existing models and established conventions without introducing duplicate tables or endpoints.
2. Identifies exact field-by-field matches, naming variances, missing columns, and type differences.
3. Recommends a phased, non-destructive alignment roadmap that preserves backward compatibility and quantitative model invariants.

---

## 2. Entity-by-Entity Detailed Reconciliation

### 2.1 Personal Profile (`UserProfile`)

| Contract Field | Existing Backend DB (`User`) | Existing Pydantic Schema (`UserProfileResponse`) | Existing Frontend Type (`Profile`) | Status / Reconciliation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `userId` (ID/UUID) | `id: Integer` (PK) | `id: int` | `id: number` | **Match**: Existing architecture uses integer sequence IDs. Map logically to `userId` via alias. |
| `fullName` (String, trimmed) | `name: String` | `name: str` | `name: string` | **Match**: Existing field is `name`. Can support `fullName` as alias in Pydantic. |
| `email` (String, verified) | `email: String` (Unique) | `email: str` | `email: string` | **Match**: Immutable via profile update, managed by auth verification. |
| `dateOfBirth` (Date / nullable) | *None* (Stores `age: Integer`) | `age: int` | `age: number` | **Gap**: Current model stores integer `age`. Derive `age` if `date_of_birth` added in future migration. |
| `occupation` (String / nullable) | *None* | *None* | *None* | **Gap**: Currently unsupported in database. Omit until migration approved. |
| `currency` (ISO 4217 code) | *None* (Implicit `"INR"`) | *None* (Implicit `"INR"`) | Implicit `INR` / `₹` | **Recommendation**: Add default `"INR"` in Pydantic schema / frontend without altering DB. |
| `createdAt` (Timestamp) | *None* | *None* | *None* | **Gap**: Present on `ScenarioRecord` and `ConversationThread`, but missing on `User`. |
| `updatedAt` (Timestamp) | *None* | *None* | *None* | **Gap**: Present on `ScenarioRecord` and `ConversationThread`, but missing on `User`. |
| *Extra Existing Fields* | `risk_tolerance: String`<br>`base_salary: Float`<br>`monthly_expenses: Float` | `risk_tolerance: str`<br>`base_salary: float`<br>`monthly_expenses: float` | `base_salary: number`<br>`monthly_expenses: number` | **Retain**: Required by stochastic Monte Carlo and emergency runway engines. |

---

### 2.2 Income and Expenses

| Contract Entity | Existing Architecture Implementation | Data Storage Location | Reconciliation Notes |
| :--- | :--- | :--- | :--- |
| **Recurring Income** | Consolidated gross monthly cashflow | `User.base_salary: Float` | Normalized to monthly recurring salary. Supports salary modification via `PUT /api/profile/me`. |
| **Recurring Expenses** | Consolidated monthly baseline living expenses | `User.monthly_expenses: Float` | Normalized to monthly period. If unset, engine defaults to `base_salary * 0.40`. |
| **Essential Flag (`isEssential`)** | Rule-based essential split | `engine/stress_engine.py` | Stress engine treats debt EMIs + baseline living expenses as essential non-discretionary commitments. |
| **Frequency Enum** | Standardized to Monthly | Implicit Monthly | Engines compute on 12-month annualization ($12 \times \text{monthly}$). |

> [!NOTE]
> ChronoFi currently consolidates income and expenses into normalized monthly figures on the `User` model rather than storing individual line-item transactions. This matches Section 3 Rule: *"Avoid duplicating existing transaction records as profile expenses."*

---

### 2.3 Assets (`Asset`)

| Contract Field | Existing Backend DB (`Asset`) | Existing Pydantic Schema (`AssetResponse`) | Existing Frontend Type (`Asset`) | Status / Reconciliation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `id` (ID/UUID) | `id: Integer` (PK) | `id: int` | `id: number` | **Match**: Sequence integer ID. |
| `userId` (ID/UUID) | `user_id: Integer` (FK) | Implicit via ownership | Implicit | **Match**: Server sets `user_id = current_user.id` on creation. |
| `name` (String) | `name: String` | `name: str` | `name: string` | **Match**: Asset label (e.g. "NIFTY 50 ETF"). |
| `category` (Enum/String) | `asset_type: String` | `asset_type: str` | `asset_type: string` | **Match**: Maps to Equity, Debt, Real Estate, Cash, Gold, Liquid. |
| `currentValue` (Decimal) | `current_value: Float` | `current_value: float` | `current_value: number` | **Match**: Current marked-to-market valuation. |
| `currency` (ISO 4217) | *None* (Implicit `"INR"`) | *None* | Formatted as `₹` (INR) | **Recommendation**: Add `currency: str = "INR"` in Pydantic schema. |
| `valuationDate` (Date) | *None* | *None* | *None* | **Gap**: Omitted rather than fabricated (adheres to Section 4). |
| `notes` (String / nullable) | *None* | *None* | *None* | **Gap**: Omitted until future schema extension. |
| `expectedReturnRate` *(Existing)* | `expected_return_rate: Float` | `expected_return_rate: float` | `expected_return_rate?: number` | **Retain**: Critical for Monte Carlo returns and asset growth projection. |

---

### 2.4 Liabilities (`Liability`)

| Contract Field | Existing Backend DB (`Liability`) | Existing Pydantic Schema (`LiabilityResponse`) | Existing Frontend Type (`Liability`) | Status / Reconciliation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `id` (ID/UUID) | `id: Integer` (PK) | `id: int` | `id: number` | **Match**: Sequence integer ID. |
| `userId` (ID/UUID) | `user_id: Integer` (FK) | Implicit via ownership | Implicit | **Match**: Assigned securely via authenticated session. |
| `name` (String) | `name: String` | `name: str` | `name: string` | **Match**: Loan name (e.g. "HDFC Home Loan"). |
| `category` (Enum/String) | *None* (Derived from `name`) | *None* | *None* | **Status**: Derived in debt engine from name string. |
| `outstandingBalance` | `principal_remaining: Float` | `principal_remaining: float` | `principal_remaining: number` | **Match**: Exact representation of remaining balance. |
| `currency` (ISO 4217) | *None* (Implicit `"INR"`) | *None* | Formatted as `₹` (INR) | **Recommendation**: Add `currency: str = "INR"` in Pydantic schema. |
| `annualInterestRate` | `interest_rate: Float` | `interest_rate: float` | `interest_rate: number` | **Convention Verified**: Stored consistently as decimal fraction `0.09` for 9.0%. |
| `monthlyPayment` | `monthly_payment: Float` | `monthly_payment: float` | `monthly_payment: number` | **Match**: Represents monthly EMI. |
| `dueDate` (Date / nullable) | *None* | *None* | *None* | **Gap**: Omitted rather than fabricated. |

---

### 2.5 Emergency Fund & Liquidity Runway

ChronoFi strictly adheres to Section 6 Rule: *"Reuse existing savings or asset records wherever possible. Do not duplicate balances already represented by assets."*

| Metric / Field | Calculation Engine Source | Logic & Formula |
| :--- | :--- | :--- |
| **Designated Savings** | `_compute_profile_kpis` ([`profile_routes.py`](file:///c:/Users/Carcass/Documents/antigravity/bold-planck/chronofi-backend/api/profile_routes.py)) | Sum of asset values matching types: `["cash", "liquid", "savings", "fd"]`. |
| **Monthly Burn Rate** | `engine/stress_engine.py` | `User.monthly_expenses + sum(l.monthly_payment for l in user.liabilities)` |
| **Months of Runway** | `_compute_profile_kpis` | $\text{Runway} = \frac{\text{Designated Liquid Assets}}{\text{Monthly Burn Rate}}$ (returns 99.0 if burn rate = 0). |
| **4-Tier Waterfall** | `engine/stress_engine.py` | Liquidation hierarchy: Tier 1 (Cash/Savings, 0% friction) $\rightarrow$ Tier 2 (Liquid MF/FD, 0.5% friction) $\rightarrow$ Tier 3 (Equity, 1-1.5% friction) $\rightarrow$ Tier 4 (Real Estate, 30% haircut). |

---

### 2.6 Life Goals (`Goal`)

| Contract Field | Existing Backend DB (`Goal`) | Existing Pydantic Schema (`GoalResponse`) | Existing Frontend Type (`Goal`) | Status / Reconciliation Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `id` (ID/UUID) | `id: Integer` (PK) | `id: int` | `id: number` | **Match**: Integer ID. |
| `userId` (ID/UUID) | `user_id: Integer` (FK) | Implicit via ownership | Implicit | **Match**: Assigned via authenticated token. |
| `name` (String) | `name: String` | `name: str` | `name: string` | **Match**: Goal title (e.g. "Child Higher Education"). |
| `targetAmount` (Decimal) | `target_amount: Float` | `target_amount: float` | `target_amount: number` | **Match**: Present value goal target. |
| `targetYears` / `targetDate` | `target_years: Integer` | `target_years: int` | `target_years: number` | **Convention**: ChronoFi stores integer horizon `target_years` (e.g. 5, 10, 20). |
| `priority` (Enum) | `priority: Enum(PriorityLevel)` | `priority: PriorityLevel` | `priority?: string` | **Match**: `Essential`, `Important`, `Aspirational`. |
| `inflationRate` | `inflation_rate: Float` (0.06) | `inflation_rate: float = 0.06` | Default 0.06 | **Match**: Used to calculate future value $FV = PV(1+i)^n$. |
| `currency` (ISO 4217) | *None* (Implicit `"INR"`) | *None* | Formatted as `₹` (INR) | **Recommendation**: Add `currency: str = "INR"` in Pydantic schema. |
| `status` (Enum) | *Computed Dynamically* | *Returned in Scenario Reports* | Displayed in Simulation Studio | **Adheres to Rule**: Status is derived from probabilistic simulation, not statically edited. |

---

### 2.7 Derived Read-Only Fields (Section 9 Alignment)

In exact compliance with Section 9, all summary metrics are computed on-the-fly and never accepted as client write payloads:

| Derived Metric | Backend Computation Function | Formula |
| :--- | :--- | :--- |
| `net_worth` | `_compute_profile_kpis` | $\sum \text{Assets} - \sum \text{Liabilities}$ |
| `monthly_investable_surplus` | `_compute_profile_kpis` | $\max(0, \text{base\_salary} - \sum \text{EMIs} - \text{monthly\_expenses})$ |
| `months_of_runway` | `_compute_profile_kpis` | $\frac{\text{Tier 1 \& 2 Liquid Assets}}{\text{monthly\_expenses} + \sum \text{EMIs}}$ |
| `total_assets` | Frontend & Tax Engines | $\sum \text{Asset.current\_value}$ |
| `total_liabilities` | Frontend & Debt Engines | $\sum \text{Liability.principal\_remaining}$ |
| `effective_tax_drag` | `engine/tax_drawdown.py` | $\frac{\text{Total Capital Gains Taxes}}{\text{Gross Projected Corpus}} \times 100$ |

---

## 3. Monetary Representation & Currency Handling

- **Existing Data Types**: Database columns use `Float` (SQLAlchemy) and `float` (Python/Pydantic).
- **Arithmetic Precision**: Financial calculations in `tax_drawdown.py`, `tax_calc.py`, and `debt_engine.py` use explicit rounding (`round(val, 2)` and `math.ceil()`).
- **Currency Convention**: The application currently targets the Indian financial jurisdiction:
  - Income tax slabs: Section 115BAC (Finance Act 2024 / FY 26-27).
  - Capital gains rates: 12.5% LTCG, 20.0% STCG, ₹1.25L annual exemption.
  - Formatted currency: `en-IN` (`₹`).
- **Recommendation for Contract Compatibility**:
  - Add explicit `currency: str = "INR"` metadata on `UserProfileResponse`, `AssetResponse`, `LiabilityResponse`, and `GoalResponse`.
  - Validate ISO 4217 strings (`"INR"`, `"USD"`, `"EUR"`) in Pydantic request models.

---

## 4. Ownership, Validation & Security Boundaries

1. **Authentication & Session Ownership**:
   - Every mutation route (`/api/profile/assets`, `/api/profile/liabilities`, `/api/profile/goals`) relies on `Depends(get_current_user)`.
   - `user_id` is extracted directly from the verified JWT bearer payload on the server. Client-provided `user_id` fields are ignored and rejected.
2. **Access Control on Deletions**:
   - `DELETE /api/profile/assets/{id}` queries `where(Asset.id == id, Asset.user_id == current_user.id)`. Deletion of another user's records yields `404 Not Found`.
3. **Data Protection**:
   - `User.hashed_password` is never included in `UserProfileResponse` or frontend payloads.

---

## 5. Non-Destructive Implementation Roadmap

To reconcile the contract without breaking existing tests, database tables, or live features:

### Step 1: Pydantic Schema Enhancement (Zero DB Mutation)
- Add `currency: str = "INR"` default to `AssetBase`, `LiabilityBase`, `GoalBase`, and `UserProfileResponse`.
- Add field aliases where helpful (e.g. `fullName` $\rightarrow$ `name`, `currentValue` $\rightarrow$ `current_value`).
- Add strict non-negative validators for amounts: `ge=0` on `current_value`, `principal_remaining`, `target_amount`, `base_salary`, `monthly_expenses`.

### Step 2: Frontend Type Harmonization
- Update `Profile` interface in [`FinancialProfile.tsx`](file:///c:/Users/Carcass/Documents/antigravity/bold-planck/src/app/dashboard/components/FinancialProfile.tsx) to document currency explicitly.

### Step 3: Deferred Schema Migration (Requires Explicit User Approval)
- If the user decides to persist `currency`, `date_of_birth`, `occupation`, or `created_at`/`updated_at` directly in SQLite/PostgreSQL, author an additive Alembic migration.
- *Strict Rule*: Do not execute any database migration without explicit Gate 3 approval.
