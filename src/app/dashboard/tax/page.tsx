"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  FileText,
  PieChart,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  Scale,
} from "lucide-react";

interface TaxResponse {
  new_regime_tax: number;
  new_regime_agri_rebate: number;
  old_regime_tax: number;
  old_regime_agri_rebate: number;
  recommendation: string;
}

interface AssetTaxBreakdown {
  asset_class: string;
  allocation_pct: number;
  allocated_corpus: number;
  allocated_principal: number;
  capital_gains: number;
  tax_rate_applied_pct: number;
  exemption_claimed: number;
  taxable_gains: number;
  tax_payable: number;
  net_post_tax_corpus: number;
}

interface GoalTaxReportResponse {
  goal_name: string;
  target_years: number;
  target_amount_nominal: number;
  inflated_target_corpus: number;
  inflation_rate: number;
  gross_projected_corpus: number;
  total_principal_invested: number;
  total_capital_gains: number;
  equity_tax: number;
  debt_tax: number;
  cess_amount: number;
  total_tax_liability: number;
  effective_tax_rate_on_gains_pct: number;
  effective_tax_drag_on_corpus_pct: number;
  net_post_tax_corpus: number;
  gross_up_target_needed?: number;
  required_gross_target_to_meet_net?: number;
  surplus_or_shortfall_post_tax?: number;
  post_tax_shortfall?: number;
  is_goal_funded_post_tax?: boolean;
  is_fully_funded_post_tax?: boolean;
  asset_breakdown?: AssetTaxBreakdown[];
  asset_breakdowns?: AssetTaxBreakdown[];
  actionable_tax_advice?: string[];
  actionable_tax_tips?: string[];
}

// Finance Act FY 2026-27 (AY 2027-28) New Tax Regime Slabs
const NEW_REGIME_SLABS = [
  { min: 0, limit: 400000, rate: 0, label: "Up to ₹4,00,000", rangeDesc: "0 – ₹4L" },
  { min: 400000, limit: 800000, rate: 5, label: "₹4,00,001 – ₹8,00,000", rangeDesc: "₹4L – ₹8L" },
  { min: 800000, limit: 1200000, rate: 10, label: "₹8,00,001 – ₹12,00,000", rangeDesc: "₹8L – ₹12L" },
  { min: 1200000, limit: 1600000, rate: 15, label: "₹12,00,001 – ₹16,00,000", rangeDesc: "₹12L – ₹16L" },
  { min: 1600000, limit: 2000000, rate: 20, label: "₹16,00,001 – ₹20,00,000", rangeDesc: "₹16L – ₹20L" },
  { min: 2000000, limit: 2400000, rate: 25, label: "₹20,00,001 – ₹24,00,000", rangeDesc: "₹20L – ₹24L" },
  { min: 2400000, limit: Infinity, rate: 30, label: "Above ₹24,00,000", rangeDesc: "Above ₹24L" },
];

const STANDARD_DEDUCTION_NEW = 75000;
const STANDARD_DEDUCTION_OLD = 50000;

export default function TaxBracketPage() {
  const [plannerTab, setPlannerTab] = useState<"income" | "drawdown">("income");

  // Income Tax State
  const [salary, setSalary] = useState<string>("1500000");
  const [deductions, setDeductions] = useState<string>("150000");
  const [agriIncome, setAgriIncome] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Capital Gains Drawdown State
  const [goalName, setGoalName] = useState<string>("Retirement Corpus");
  const [targetYears, setTargetYears] = useState<number>(15);
  const [targetAmount, setTargetAmount] = useState<number>(10000000);
  const [grossCorpus, setGrossCorpus] = useState<number>(12500000);
  const [totalPrincipal, setTotalPrincipal] = useState<number>(6000000);
  const [equityPct, setEquityPct] = useState<number>(70);
  const [debtPct, setDebtPct] = useState<number>(20);
  const [exemptPct, setExemptPct] = useState<number>(10);
  const [isDrawdownLoading, setIsDrawdownLoading] = useState<boolean>(false);
  const [drawdownResult, setDrawdownResult] = useState<GoalTaxReportResponse | null>(null);

  // Fetch initial user profile salary if available
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.base_salary) setSalary(data.base_salary.toString());
        })
        .catch(console.error);
    }
  }, []);

  const handleCalculateIncomeTax = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numSalary = parseFloat(salary);
    if (isNaN(numSalary) || numSalary < 0) {
      setValidationError("Please enter a valid non-negative gross salary.");
      return;
    }
    setValidationError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tax/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          salary: numSalary,
          deductions: Math.max(0, parseFloat(deductions) || 0),
          agri_income: Math.max(0, parseFloat(agriIncome) || 0),
        }),
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (err) {
      console.error("Tax calculation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDrawdown = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsDrawdownLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tax/goal-drawdown", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goal_name: goalName,
          target_years: targetYears,
          target_amount: targetAmount,
          gross_projected_corpus: grossCorpus,
          total_principal_invested: totalPrincipal,
          equity_pct: equityPct / 100,
          debt_pct: debtPct / 100,
          exempt_pct: exemptPct / 100,
          marginal_tax_rate: 0.3,
          inflation_rate: 0.06,
        }),
      });
      if (res.ok) {
        setDrawdownResult(await res.json());
      }
    } catch (err) {
      console.error("Drawdown calculation failed:", err);
    } finally {
      setIsDrawdownLoading(false);
    }
  };

  useEffect(() => {
    handleCalculateIncomeTax();
    handleCalculateDrawdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.round(val));

  // Numeric values for calculation breakdown
  const numSalary = Math.max(0, parseFloat(salary) || 0);
  const numDeductions = Math.max(0, parseFloat(deductions) || 0);

  const taxableIncomeNew = Math.max(0, numSalary - STANDARD_DEDUCTION_NEW);
  const taxableIncomeOld = Math.max(0, numSalary - STANDARD_DEDUCTION_OLD - numDeductions);

  // Determine current active slab under New Regime
  const effectiveSlabIndex = useMemo(() => {
    const idx = NEW_REGIME_SLABS.findIndex((slab) => taxableIncomeNew <= slab.limit);
    return idx === -1 ? NEW_REGIME_SLABS.length - 1 : idx;
  }, [taxableIncomeNew]);

  // Dynamic Regime Analysis and Savings Calculation
  const regimeAnalysis = useMemo(() => {
    if (!result) return null;
    const diff = Math.abs(result.new_regime_tax - result.old_regime_tax);
    const isTie = Math.abs(result.new_regime_tax - result.old_regime_tax) < 1;
    const isNewBetter = result.new_regime_tax < result.old_regime_tax;

    let title = "New Tax Regime";
    let rationale = "";

    if (isTie) {
      title = "Equal Tax Liability";
      rationale = `Both regimes produce the identical annual tax of ${formatCurrency(
        result.new_regime_tax
      )}. You can select either regime based on filing documentation convenience.`;
    } else if (isNewBetter) {
      title = "New Tax Regime";
      rationale = `The New Regime offers lower progressive slab rates and a higher ₹75,000 standard deduction, saving ${formatCurrency(
        diff
      )} compared to the Old Regime.`;
    } else {
      title = "Old Tax Regime";
      rationale = `Your declared deductions of ${formatCurrency(
        numDeductions
      )} plus ₹50,000 standard deduction lower your taxable income sufficiently to save ${formatCurrency(
        diff
      )} under the Old Regime.`;
    }

    return {
      isTie,
      isNewBetter,
      title,
      diff,
      rationale,
      recommendedTax: isNewBetter ? result.new_regime_tax : result.old_regime_tax,
      alternativeTax: isNewBetter ? result.old_regime_tax : result.new_regime_tax,
    };
  }, [result, numDeductions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col gap-6 relative z-10 min-h-screen">
      {/* Header and Mode Switcher */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-zinc-200" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
              Tax Planner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 pl-10.5">
            FY 2026–27 (AY 2027–28) Section 115BAC comparison & Finance Act LTCG decumulation studio.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 self-start shadow-sm">
          <button
            onClick={() => setPlannerTab("income")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              plannerTab === "income"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-zinc-300" />
            Income Tax (New vs Old)
          </button>
          <button
            onClick={() => setPlannerTab("drawdown")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              plannerTab === "drawdown"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-zinc-400" />
            Capital Gains Drawdown (Budget 2024)
          </button>
        </div>
      </header>

      {plannerTab === "income" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Inputs and Tax Reference Slabs (5 cols)      */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Income Details Form Card */}
            <motion.form
              onSubmit={handleCalculateIncomeTax}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 border border-zinc-800/80 rounded-xl bg-zinc-900/90 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-base font-semibold text-zinc-100">Income Details</h2>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                  FY 2026–27
                </span>
              </div>

              {validationError && (
                <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Gross Salary */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Annual Gross Salary (CTC)
                    </label>
                    <span className="text-[11px] font-mono text-zinc-500 font-semibold">INR (₹)</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={salary}
                      onChange={(e) => {
                        setSalary(e.target.value);
                        if (validationError) setValidationError(null);
                      }}
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all placeholder:text-zinc-600"
                      placeholder="e.g. 1500000"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Total annual compensation prior to standard deduction.
                  </p>
                </div>

                {/* Old Regime Deductions */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Declared Deductions (Old Regime)
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">80C, 80D, HRA</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={deductions}
                      onChange={(e) => setDeductions(e.target.value)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all placeholder:text-zinc-600"
                      placeholder="e.g. 150000"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Applies strictly to Old Regime (Chapter VI-A itemized exemptions).
                  </p>
                </div>

                {/* Agricultural Income */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Agricultural Income <span className="font-normal text-zinc-500">(Optional)</span>
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Partial Integration</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={agriIncome}
                      onChange={(e) => setAgriIncome(e.target.value)}
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-7 pr-3 py-2 text-zinc-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all placeholder:text-zinc-600"
                      placeholder="e.g. 0"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Integrated for rate calculation if &gt; ₹5,000 and taxable income exceeds threshold.
                  </p>
                </div>

                {/* Submit Recalculate Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>Recalculating Taxes...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 text-zinc-950" />
                      <span>Recalculate Tax</span>
                    </>
                  )}
                </button>
              </div>
            </motion.form>

            {/* New Regime Slabs Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="p-5 sm:p-6 border border-zinc-800/80 rounded-xl bg-zinc-900/90 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-base font-semibold text-zinc-100">New Tax Regime Slabs</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                  Sec 115BAC
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-3.5">
                Finance Act FY 2026–27 progressive brackets for salaried resident individuals:
              </p>

              <div className="space-y-1.5">
                {NEW_REGIME_SLABS.map((slab, idx) => {
                  const isCurrent = idx === effectiveSlabIndex;
                  return (
                    <div
                      key={slab.label}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                        isCurrent
                          ? "bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm"
                          : "bg-zinc-950/40 border-zinc-800/40 text-zinc-400 hover:bg-zinc-950/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
                        )}
                        <span className={isCurrent ? "text-zinc-100 font-semibold" : "text-zinc-300"}>
                          {slab.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                            Active Slab
                          </span>
                        )}
                        <span
                          className={`font-mono text-xs font-bold ${
                            isCurrent ? "text-emerald-400" : "text-zinc-400"
                          }`}
                        >
                          {slab.rate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-start gap-2 text-[11px] text-zinc-400">
                <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <span>
                  Section 156 full rebate applies up to ₹12 Lakhs taxable income (zero tax liability), with marginal relief for incomes marginally above ₹12L.
                </span>
              </div>
            </motion.div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: Results, Comparison, Notes (7 cols)         */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <AnimatePresence mode="wait">
              {result && regimeAnalysis ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.99 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-6"
                >
                  {/* Recommended Regime Summary Card */}
                  <div
                    className={`p-5 sm:p-6 rounded-xl border backdrop-blur-md shadow-xl relative overflow-hidden transition-all ${
                      regimeAnalysis.isTie
                        ? "bg-zinc-900/90 border-zinc-700"
                        : regimeAnalysis.isNewBetter
                        ? "bg-gradient-to-r from-emerald-950/20 via-zinc-900/95 to-zinc-900/90 border-emerald-800/40"
                        : "bg-gradient-to-r from-blue-950/20 via-zinc-900/95 to-zinc-900/90 border-blue-800/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          {regimeAnalysis.isTie ? (
                            <Scale className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <ShieldCheck
                              className={`w-5 h-5 ${
                                regimeAnalysis.isNewBetter ? "text-emerald-400" : "text-blue-400"
                              }`}
                            />
                          )}
                          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                            Recommendation
                          </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
                          {regimeAnalysis.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed max-w-xl">
                          {regimeAnalysis.rationale}
                        </p>
                      </div>

                      {/* Savings Metric Box */}
                      <div className="sm:text-right shrink-0 p-3 sm:p-0 rounded-lg bg-zinc-950/40 sm:bg-transparent border sm:border-0 border-zinc-800">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                          Annual Tax Savings
                        </span>
                        <span
                          className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                            regimeAnalysis.isTie
                              ? "text-zinc-400"
                              : regimeAnalysis.isNewBetter
                              ? "text-emerald-400"
                              : "text-blue-400"
                          }`}
                        >
                          {regimeAnalysis.isTie ? "₹0" : formatCurrency(regimeAnalysis.diff)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">
                          vs. {regimeAnalysis.isNewBetter ? "Old Regime" : "New Regime"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Highlights Bar */}
                    <div className="mt-4 pt-3.5 border-t border-zinc-800/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] uppercase font-mono text-zinc-500">
                          {regimeAnalysis.isTie ? "Estimated Tax" : "Recommended Tax"}
                        </p>
                        <p className="font-mono font-bold text-zinc-100 text-sm mt-0.5">
                          {formatCurrency(regimeAnalysis.recommendedTax)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-mono text-zinc-500">
                          {regimeAnalysis.isTie ? "Alternative Tax" : "Alternative Tax"}
                        </p>
                        <p className="font-mono text-zinc-400 text-sm mt-0.5">
                          {formatCurrency(regimeAnalysis.alternativeTax)}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] uppercase font-mono text-zinc-500">Standard Deduction</p>
                        <p className="font-mono font-medium text-zinc-200 text-sm mt-0.5">
                          {regimeAnalysis.isNewBetter ? "₹75,000 (New)" : "₹50,000 (Old)"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* --- New Tax Regime Card --- */}
                    <div
                      className={`p-5 rounded-xl border backdrop-blur-md shadow-xl flex flex-col justify-between transition-all ${
                        regimeAnalysis.isNewBetter
                          ? "bg-zinc-900/90 border-zinc-700 ring-1 ring-zinc-700/60"
                          : "bg-zinc-900/80 border-zinc-800/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-zinc-100">New Tax Regime</h3>
                            <p className="text-[10px] font-mono text-zinc-500">Section 115BAC (Default)</p>
                          </div>
                          {regimeAnalysis.isNewBetter && (
                            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 rounded text-[10px] font-semibold text-emerald-400 font-mono">
                              Recommended
                            </span>
                          )}
                        </div>

                        {/* Final Estimated Tax (Visual Focal Point) */}
                        <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 my-3">
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold mb-1">
                            Total Estimated Tax
                          </p>
                          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-100">
                            {formatCurrency(result.new_regime_tax)}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">
                            Includes 4% Health & Education Cess
                          </p>
                        </div>

                        {/* Breakdown Rows */}
                        <div className="space-y-2 text-xs pt-1">
                          <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/50">
                            <span>Gross Annual Salary</span>
                            <span className="font-mono text-zinc-200 font-medium">
                              {formatCurrency(numSalary)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/50">
                            <span>Standard Deduction</span>
                            <span className="font-mono text-zinc-200 font-medium">₹75,000</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/50">
                            <span>Itemized Deductions</span>
                            <span className="text-[11px] text-zinc-500 font-mono">Not Applicable</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-300 py-1 font-semibold">
                            <span>Net Taxable Income</span>
                            <span className="font-mono text-zinc-100">
                              {formatCurrency(taxableIncomeNew)}
                            </span>
                          </div>

                          {/* Rebates if any */}
                          {taxableIncomeNew <= 1200000 && (
                            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 mt-2">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Sec 156 Rebate Applied (Taxable ≤ ₹12L)</span>
                            </div>
                          )}

                          {result.new_regime_agri_rebate > 0 && (
                            <div className="p-2 rounded bg-zinc-800/60 border border-zinc-700/50 text-[11px] text-zinc-300 font-mono flex items-center justify-between mt-1">
                              <span>Agri Rebate Applied:</span>
                              <span>{formatCurrency(result.new_regime_agri_rebate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* --- Old Tax Regime Card --- */}
                    <div
                      className={`p-5 rounded-xl border backdrop-blur-md shadow-xl flex flex-col justify-between transition-all ${
                        !regimeAnalysis.isNewBetter && !regimeAnalysis.isTie
                          ? "bg-zinc-900/90 border-zinc-700 ring-1 ring-zinc-700/60"
                          : "bg-zinc-900/80 border-zinc-800/80"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="text-sm font-bold text-zinc-100">Old Tax Regime</h3>
                            <p className="text-[10px] font-mono text-zinc-500">With Chapter VI-A Deductions</p>
                          </div>
                          {!regimeAnalysis.isNewBetter && !regimeAnalysis.isTie && (
                            <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/30 rounded text-[10px] font-semibold text-blue-400 font-mono">
                              Recommended
                            </span>
                          )}
                        </div>

                        {/* Final Estimated Tax (Visual Focal Point) */}
                        <div className="p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 my-3">
                          <p className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold mb-1">
                            Total Estimated Tax
                          </p>
                          <p className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-100">
                            {formatCurrency(result.old_regime_tax)}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">
                            Includes 4% Health & Education Cess
                          </p>
                        </div>

                        {/* Breakdown Rows */}
                        <div className="space-y-2 text-xs pt-1">
                          <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/50">
                            <span>Gross Annual Salary</span>
                            <span className="font-mono text-zinc-200 font-medium">
                              {formatCurrency(numSalary)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/50">
                            <span>Standard Deduction</span>
                            <span className="font-mono text-zinc-200 font-medium">₹50,000</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400 py-1 border-b border-zinc-800/50">
                            <span>Declared Deductions</span>
                            <span className="font-mono text-zinc-200 font-medium">
                              {formatCurrency(numDeductions)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-300 py-1 font-semibold">
                            <span>Net Taxable Income</span>
                            <span className="font-mono text-zinc-100">
                              {formatCurrency(taxableIncomeOld)}
                            </span>
                          </div>

                          {/* Rebates if any */}
                          {taxableIncomeOld <= 500000 && (
                            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 font-mono flex items-center gap-1.5 mt-2">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Sec 156 Rebate Applied (Taxable ≤ ₹5L)</span>
                            </div>
                          )}

                          {result.old_regime_agri_rebate > 0 && (
                            <div className="p-2 rounded bg-zinc-800/60 border border-zinc-700/50 text-[11px] text-zinc-300 font-mono flex items-center justify-between mt-1">
                              <span>Agri Rebate Applied:</span>
                              <span>{formatCurrency(result.old_regime_agri_rebate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Assumptions and Disclaimers */}
                  <div className="p-4 sm:p-5 border border-zinc-800/70 rounded-xl bg-zinc-900/60 backdrop-blur-md text-xs text-zinc-400 space-y-1.5">
                    <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-1">
                      <Info className="w-4 h-4 text-zinc-400" />
                      <span>Statutory Calculation Notes & Disclaimers</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 leading-relaxed">
                      <li>
                        All calculations include the mandatory 4% Health & Education Cess on income tax.
                      </li>
                      <li>
                        New Regime calculation implements Finance Act FY 2026–27 provisions under Section 115BAC, including the ₹75,000 standard deduction and Section 156 (formerly 87A) full rebate for taxable income up to ₹12 Lakhs with marginal relief.
                      </li>
                      <li>
                        Old Regime calculation incorporates ₹50,000 standard deduction, Section 156 rebate up to ₹5 Lakhs, and itemized Chapter VI-A deductions.
                      </li>
                      <li>
                        Calculations apply to individual resident taxpayers below 60 years of age. Agricultural income exceeding ₹5,000 is partially integrated for rate determination.
                      </li>
                    </ul>
                  </div>
                </motion.div>
              ) : (
                <div className="border border-zinc-800/80 rounded-xl bg-zinc-900/90 flex flex-col items-center justify-center p-12 backdrop-blur-md shadow-xl min-h-[360px]">
                  <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mb-4" />
                  <p className="text-sm font-medium text-zinc-300">
                    Evaluating Tax Optimization Engine...
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Calculating comparative liabilities under Section 115BAC.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* CAPITAL GAINS DRAWDOWN STUDIO (Budget 2024 LTCG / STCG)   */
        /* ========================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Parameters Form */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.form
              onSubmit={handleCalculateDrawdown}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 sm:p-6 border border-zinc-800/80 rounded-xl bg-zinc-900/90 shadow-xl backdrop-blur-md space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-semibold text-zinc-100">Goal Decumulation Settings</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Goal Description
                </label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-3.5 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Horizon (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={targetYears}
                    onChange={(e) => setTargetYears(Number(e.target.value))}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Target In-Hand (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Gross Corpus (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={grossCorpus}
                    onChange={(e) => setGrossCorpus(Number(e.target.value))}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Total Principal (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={totalPrincipal}
                    onChange={(e) => setTotalPrincipal(Number(e.target.value))}
                    className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Asset Allocation Mix */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">Asset Allocation Mix:</span>
                  <span className="font-mono text-zinc-200">
                    Equity {equityPct}% | Debt {debtPct}% | Exempt {exemptPct}%
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-400">Equity (12.5% LTCG above ₹1.25L exemption)</span>
                    <span className="text-emerald-400 font-mono font-bold">{equityPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={equityPct}
                    onChange={(e) => {
                      const eq = Number(e.target.value);
                      const rem = 100 - eq;
                      setEquityPct(eq);
                      setDebtPct(Math.round(rem * 0.7));
                      setExemptPct(rem - Math.round(rem * 0.7));
                    }}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Debt / FD % (Slab Rate)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={debtPct}
                      onChange={(e) => setDebtPct(Number(e.target.value))}
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-400 mb-1 font-medium">Tax-Exempt % (PPF/EPF)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={exemptPct}
                      onChange={(e) => setExemptPct(Number(e.target.value))}
                      className="w-full bg-zinc-950/70 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isDrawdownLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold py-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDrawdownLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Calculating Drawdown...</span>
                  </>
                ) : (
                  <span>Calculate Post-Tax Drawdown</span>
                )}
              </button>
            </motion.form>
          </div>

          {/* Right Column: Drawdown Report */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {drawdownResult ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-900/90 shadow-xl backdrop-blur-md">
                    <span className="text-xs text-zinc-400 block mb-1">Gross Projected Corpus</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">
                      {formatCurrency(drawdownResult.gross_projected_corpus)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1">
                      Capital Gains: {formatCurrency(drawdownResult.total_capital_gains)}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-900/40 bg-zinc-900/90 shadow-xl backdrop-blur-md">
                    <span className="text-xs text-rose-400 block mb-1">Total Capital Gains Tax</span>
                    <span className="text-xl font-bold font-mono text-rose-400">
                      {formatCurrency(drawdownResult.total_tax_liability)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block mt-1 font-mono">
                      Drag: {drawdownResult.effective_tax_drag_on_corpus_pct.toFixed(2)}% of corpus
                    </span>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-900/40 bg-zinc-900/90 shadow-xl backdrop-blur-md">
                    <span className="text-xs text-emerald-400 block mb-1">Net Post-Tax In-Hand</span>
                    <span className="text-xl font-bold font-mono text-emerald-400">
                      {formatCurrency(drawdownResult.net_post_tax_corpus)}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                      {(drawdownResult.is_fully_funded_post_tax ?? drawdownResult.is_goal_funded_post_tax) ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Covers Inflated Goal</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Deficit post-tax</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Gross-Up Advice Banner */}
                <div className="p-4 rounded-xl border border-amber-900/40 bg-zinc-900/90 shadow-xl backdrop-blur-md flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-amber-300">
                      Target Gross-Up Required: {formatCurrency(drawdownResult.required_gross_target_to_meet_net ?? drawdownResult.gross_up_target_needed ?? 0)}
                    </p>
                    <p className="text-zinc-400 leading-relaxed">
                      To safely realize your in-hand goal target of {formatCurrency(drawdownResult.inflated_target_corpus)} after Indian LTCG/STCG taxes, your pre-tax investment corpus must reach {formatCurrency(drawdownResult.required_gross_target_to_meet_net ?? drawdownResult.gross_up_target_needed ?? 0)}.
                    </p>
                  </div>
                </div>

                {/* Asset Tier Breakdown Table */}
                <div className="border border-zinc-800/80 rounded-xl bg-zinc-900/90 shadow-xl backdrop-blur-md p-5">
                  <h4 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Asset Class Taxation Breakdown (Budget 2024 Rules)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-zinc-500 border-b border-zinc-800/80 font-mono">
                        <tr>
                          <th className="pb-2">Asset Class</th>
                          <th className="pb-2">Allocation</th>
                          <th className="pb-2">Corpus</th>
                          <th className="pb-2">Tax Rate</th>
                          <th className="pb-2 text-right">Tax Payable</th>
                          <th className="pb-2 text-right">Net Corpus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {(drawdownResult.asset_breakdowns || drawdownResult.asset_breakdown || []).map((item) => (
                          <tr key={item.asset_class} className="hover:bg-zinc-800/30">
                            <td className="py-2.5 font-medium text-zinc-200">{item.asset_class}</td>
                            <td className="py-2.5 font-mono text-zinc-400">
                              {(item.allocation_pct * 100).toFixed(0)}%
                            </td>
                            <td className="py-2.5 font-mono text-zinc-300">
                              {formatCurrency(item.allocated_corpus)}
                            </td>
                            <td className="py-2.5 text-zinc-400">
                              {item.tax_rate_applied_pct}%
                              {item.exemption_claimed > 0 && " (₹1.25L exempt)"}
                            </td>
                            <td className="py-2.5 font-mono text-rose-400 text-right">
                              {formatCurrency(item.tax_payable)}
                            </td>
                            <td className="py-2.5 font-mono text-emerald-400 text-right font-medium">
                              {formatCurrency(item.net_post_tax_corpus)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actionable Advice List */}
                <div className="p-4 rounded-xl border border-zinc-800/70 bg-zinc-900/90 shadow-xl backdrop-blur-md space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Actionable Tax-Optimization Strategies
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-300">
                    {(drawdownResult.actionable_tax_tips || drawdownResult.actionable_tax_advice || []).map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <div className="border border-zinc-800/80 rounded-xl bg-zinc-900/90 flex flex-col items-center justify-center p-12 backdrop-blur-md shadow-xl min-h-[360px]">
                <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin mb-4" />
                <p className="text-sm font-medium text-zinc-300">Awaiting Decumulation Parameters...</p>
                <p className="text-xs text-zinc-500 mt-1">Configure asset mix and target goals.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
