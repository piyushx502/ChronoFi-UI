"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingDown,
  Calendar,
  DollarSign,
  ShieldAlert,
  Car,
  CheckCircle2,
  Sliders,
  ChevronRight,
  RefreshCw,
  Sparkles,
  AlertCircle
} from "lucide-react";

export interface ScenarioResultData {
  scenario_id: string;
  scenario_type: string;
  status: string;
  effective_assumptions: {
    field: string;
    value: string | number;
    source: string;
    description: string;
  }[];
  loan_metrics?: {
    monthly_emi: number;
    principal: number;
    annual_interest_rate: number;
    tenure_months: number;
    total_payment: number;
    total_interest: number;
    is_zero_interest: boolean;
  };
  baseline: {
    retirement_age: number;
    projected_corpus: number;
    goal_success_probability: number;
    monthly_investable_surplus: number;
    worst_case_10th_percentile: number;
    expected_50th_percentile: number;
    best_case_90th_percentile: number;
    conditional_value_at_risk_cvar: number;
  };
  modified: {
    retirement_age: number;
    projected_corpus: number;
    goal_success_probability: number;
    monthly_investable_surplus: number;
    worst_case_10th_percentile: number;
    expected_50th_percentile: number;
    best_case_90th_percentile: number;
    conditional_value_at_risk_cvar: number;
  };
  impact: {
    retirement_age_difference: number;
    corpus_difference: number;
    success_probability_difference: number;
    monthly_cash_flow_difference: number;
    total_interest_paid: number;
  };
  alternatives: {
    name: string;
    description: string;
    loan_principal: number;
    loan_tenure_months: number;
    down_payment: number;
    monthly_emi: number;
    total_interest: number;
    projected_corpus: number;
    goal_success_probability: number;
    retirement_age_difference: number;
    trade_off_summary: string;
  }[];
  trajectory: {
    year: number;
    age: number;
    baseline_expected: number;
    modified_expected: number;
    baseline_worst: number;
    modified_worst: number;
    target_corpus: number;
  }[];
  warnings: string[];
  goal_impacts?: {
    goal_id?: number | null;
    name: string;
    priority: string;
    target_amount: number;
    target_years: number;
    inflated_target: number;
    monthly_sip_required: number;
    baseline_monthly_allocated: number;
    baseline_projected_corpus: number;
    baseline_funding_ratio: number;
    baseline_status: string;
    modified_monthly_allocated: number;
    modified_projected_corpus: number;
    modified_funding_ratio: number;
    modified_status: string;
    monthly_allocation_change: number;
    corpus_shortfall: number;
    projected_delay_months: number;
    trade_off_note: string;
  }[];
  engine_version: string;
}

interface ScenarioComparisonProps {
  scenarioData: ScenarioResultData | null;
  onRunScenario: (params: {
    principal: number;
    rate: number;
    tenure: number;
    downPayment?: number;
  }) => Promise<void>;
  isLoading?: boolean;
}

export default function ScenarioComparison({
  scenarioData,
  onRunScenario,
  isLoading = false,
}: ScenarioComparisonProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [principal, setPrincipal] = useState(1000000);
  const [rate, setRate] = useState(9.0);
  const [tenureMonths, setTenureMonths] = useState(60);
  const [downPayment, setDownPayment] = useState(0);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onRunScenario({
      principal,
      rate: rate / 100.0,
      tenure: tenureMonths,
      downPayment,
    });
  };

  const runQuickScenario = async (p: number, r: number, t: number, dp: number = 0) => {
    setPrincipal(p);
    setRate(r * 100);
    setTenureMonths(t);
    setDownPayment(dp);
    await onRunScenario({ principal: p, rate: r, tenure: t, downPayment: dp });
  };

  if (!scenarioData) {
    return (
      <div className="flex flex-col h-full justify-between p-4 bg-zinc-950/40 rounded-xl border border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-2 text-zinc-100 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3>What-If Financial Decision Simulator</h3>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Hypothetical decisions are simulated against your baseline plan without affecting real accounts.
          </p>

          <div className="space-y-2 mb-4">
            <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              Quick Test Scenarios
            </p>
            <button
              onClick={() => runQuickScenario(1000000, 0.09, 60, 0)}
              disabled={isLoading}
              className="w-full text-left p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    ₹10 Lakh Car Loan @ 9% (5 Years)
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Standard vehicle financing decision
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => runQuickScenario(700000, 0.09, 60, 0)}
              disabled={isLoading}
              className="w-full text-left p-3 rounded-lg bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-medium text-zinc-200">
                    ₹7 Lakh Budget Car Loan @ 9%
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    30% lower vehicle budget alternative
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-xs flex items-center justify-center gap-1.5 py-2 text-zinc-400 hover:text-zinc-200 transition"
        >
          <Sliders className="w-3.5 h-3.5" />
          {showConfig ? "Hide Custom Inputs" : "Configure Custom Scenario"}
        </button>

        {showConfig && (
          <form onSubmit={handleCustomSubmit} className="mt-3 space-y-3 pt-3 border-t border-zinc-800">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Loan Amount (₹)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Tenure (Months)</label>
                <input
                  type="number"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-400 block mb-1">Down Payment (₹)</label>
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-100"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-1.5 text-xs font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
              Execute Simulation
            </button>
          </form>
        )}
      </div>
    );
  }

  const { baseline, modified, impact, loan_metrics, effective_assumptions, alternatives, warnings } = scenarioData;

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1 space-y-4 custom-scrollbar">
      {/* Header & Status */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-100">
              Scenario Simulation: Vehicle Loan
            </h3>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              Verified Engine Result
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Engine: {scenarioData.engine_version} • Read-Only Simulation
          </p>
        </div>

        <button
          onClick={() => runQuickScenario(1000000, 0.09, 60, 0)}
          disabled={isLoading}
          className="text-xs flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition bg-zinc-900 px-2 py-1 rounded border border-zinc-800"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          Rerun
        </button>
      </div>

      {/* Warnings if any */}
      {warnings && warnings.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>{warnings.join(" ")}</div>
        </div>
      )}

      {/* Assumption Review Badge Bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5">
        <p className="text-[10px] font-semibold uppercase text-zinc-500 tracking-wider mb-2">
          Documented Assumptions
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          {effective_assumptions.map((a, i) => (
            <span
              key={i}
              className="bg-zinc-950 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[11px] flex items-center gap-1"
            >
              <span className="text-zinc-500">{a.field}:</span>
              <span className="font-mono font-medium text-zinc-200">
                {typeof a.value === "number" && a.value >= 1000
                  ? formatCurrency(a.value)
                  : typeof a.value === "number" && a.value < 1 && a.value > 0
                  ? `${(a.value * 100).toFixed(1)}%`
                  : String(a.value)}
              </span>
              <span className="text-[9px] text-zinc-500 italic">({a.source})</span>
            </span>
          ))}
        </div>
      </div>

      {/* Impact Metric Comparison Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* Metric 1: Retirement Age */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Retirement Age</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-zinc-100">
              {modified.retirement_age} Yrs
            </span>
            <span className="text-xs text-zinc-500 line-through">
              {baseline.retirement_age}
            </span>
          </div>
          <p className="text-[10px] text-rose-400 font-medium mt-1">
            +{impact.retirement_age_difference} Years Delay
          </p>
        </div>

        {/* Metric 2: Projected Corpus */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Projected Corpus</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-zinc-100">
              ₹{(modified.projected_corpus / 10000000).toFixed(2)} Cr
            </span>
            <span className="text-[10px] text-zinc-500 line-through">
              ₹{(baseline.projected_corpus / 10000000).toFixed(2)}
            </span>
          </div>
          <p className="text-[10px] text-rose-400 font-medium mt-1">
            -₹{(Math.abs(impact.corpus_difference) / 100000).toFixed(1)} Lakh
          </p>
        </div>

        {/* Metric 3: Monthly Surplus */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Monthly Surplus</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-zinc-100">
              {formatCurrency(modified.monthly_investable_surplus)}
            </span>
          </div>
          <p className="text-[10px] text-rose-400 font-medium mt-1">
            -₹{loan_metrics?.monthly_emi.toLocaleString()} EMI
          </p>
        </div>

        {/* Metric 4: Goal Success Probability */}
        <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
            <span>Success Probability</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-semibold text-zinc-100">
              {modified.goal_success_probability}%
            </span>
            <span className="text-xs text-zinc-500 line-through">
              {baseline.goal_success_probability}%
            </span>
          </div>
          <p className="text-[10px] text-rose-400 font-medium mt-1">
            {impact.success_probability_difference}% Drop
          </p>
        </div>
      </div>

      {/* Financing Cost Card */}
      {loan_metrics && (
        <div className="p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400">Total Borrowing Cost: </span>
            <span className="text-zinc-200 font-medium">
              Principal {formatCurrency(loan_metrics.principal)} + Interest{" "}
              <span className="text-amber-400 font-semibold font-mono">
                {formatCurrency(loan_metrics.total_interest)}
              </span>
            </span>
          </div>
          <div className="text-zinc-400 font-mono text-[11px]">
            Total Payment: {formatCurrency(loan_metrics.total_payment)}
          </div>
        </div>
      )}

      {/* Multi-Goal Life Impact Waterfall */}
      {scenarioData.goal_impacts && scenarioData.goal_impacts.length > 0 && (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <h4 className="text-xs font-semibold text-zinc-200">
                Multi-Goal Conflict & Waterfall Analysis
              </h4>
            </div>
            <span className="text-[10px] text-zinc-500">
              Deterministic Priority Allocation
            </span>
          </div>

          <div className="space-y-2">
            {scenarioData.goal_impacts.map((g, idx) => {
              const isOnTrack = g.modified_status === "On Track";
              const isAtRisk = g.modified_status === "At Risk";
              const statusColor = isOnTrack
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : isAtRisk
                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                : "text-rose-400 bg-rose-500/10 border-rose-500/20";
              const priorityColor =
                g.priority === "Essential"
                  ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                  : g.priority === "Important"
                  ? "text-purple-400 border-purple-500/30 bg-purple-500/10"
                  : "text-amber-400 border-amber-500/30 bg-amber-500/10";

              return (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-zinc-200">{g.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${priorityColor}`}>
                        {g.priority}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusColor}`}>
                        {g.modified_status} ({g.modified_funding_ratio}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {g.trade_off_note}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400 border-t md:border-t-0 md:border-l border-zinc-800/60 pt-1.5 md:pt-0 md:pl-3 shrink-0">
                    <div>
                      <span className="text-zinc-500">Monthly SIP: </span>
                      <span className="text-zinc-200">₹{Math.round(g.modified_monthly_allocated).toLocaleString()}</span>
                      {g.monthly_allocation_change < 0 && (
                        <span className="text-rose-400 text-[9px] ml-1">
                          ({Math.round(g.monthly_allocation_change).toLocaleString()})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-zinc-500">Target: </span>
                      <span className="text-zinc-200">₹{(g.target_amount / 100000).toFixed(1)}L</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actionable Alternatives Panel */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-zinc-300">
            Actionable Alternatives (Evaluated by Engine)
          </h4>
          <span className="text-[10px] text-zinc-500">Click to re-simulate</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {alternatives.map((alt, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.01 }}
              className="p-3 rounded-lg bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex flex-col justify-between"
              onClick={() =>
                runQuickScenario(alt.loan_principal, 0.09, alt.loan_tenure_months, alt.down_payment)
              }
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-zinc-200">{alt.name}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Success: {alt.goal_success_probability}%
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
                  {alt.trade_off_summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                <span>EMI: {formatCurrency(alt.monthly_emi)}/mo</span>
                <span>Interest: {formatCurrency(alt.total_interest)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
