"use client";

import { useState } from "react";
import {
  CreditCard,
  Zap,
  TrendingUp,
  DollarSign,
  Calendar,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Award,
} from "lucide-react";

interface LoanMilestone {
  liability_id: number;
  liability_name: string;
  payoff_month: number;
  principal_paid: number;
  interest_paid: number;
}

interface StrategyResult {
  strategy_name: string;
  months_to_debt_free: number;
  total_interest_paid: number;
  total_principal_paid: number;
  interest_saved_vs_baseline: number;
  months_saved_vs_baseline: number;
  loan_milestones: LoanMilestone[];
}

interface DebtOptimizationResult {
  total_initial_debt: number;
  extra_monthly_prepayment: number;
  lump_sum_prepayment: number;
  recommended_strategy: string;
  financial_savings_diff_avalanche_vs_snowball: number;
  baseline: StrategyResult;
  avalanche: StrategyResult;
  snowball: StrategyResult;
  actionable_takeaways: string[];
}

export default function DebtPayoffOptimizer() {
  const [extraPrepayment, setExtraPrepayment] = useState<number>(5000);
  const [lumpSum, setLumpSum] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DebtOptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunOptimization = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/debt/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          extra_monthly_prepayment: extraPrepayment,
          lump_sum_prepayment: lumpSum,
        }),
      });

      if (!res.ok) {
        throw new Error(`Debt optimization failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to run debt optimization.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 text-zinc-100 overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-100">
            Debt Avalanche vs Snowball Payoff Accelerator
          </h2>
        </div>
        <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
          Deterministic Amortization
        </span>
      </div>

      {/* Prepayment Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs">
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 font-medium">
            Extra Monthly Prepayment: ₹{extraPrepayment.toLocaleString("en-IN")}
          </label>
          <input
            type="range"
            min={0}
            max={50000}
            step={1000}
            value={extraPrepayment}
            onChange={(e) => setExtraPrepayment(Number(e.target.value))}
            className="accent-indigo-500 mt-1 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 font-medium">
            One-Time Lump Sum Prepayment: ₹{lumpSum.toLocaleString("en-IN")}
          </label>
          <input
            type="range"
            min={0}
            max={300000}
            step={10000}
            value={lumpSum}
            onChange={(e) => setLumpSum(Number(e.target.value))}
            className="accent-indigo-500 mt-1 cursor-pointer"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleRunOptimization}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2 px-3 rounded-lg text-xs transition shadow-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Calculate Acceleration
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Results Comparison Grid */}
      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Baseline Card */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400">Baseline Plan</span>
              <span className="text-[11px] text-zinc-500">Minimum monthly payments only</span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Debt-Free In:</span>
                  <span className="font-mono font-medium text-zinc-200">
                    {result.baseline.months_to_debt_free} Months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Interest:</span>
                  <span className="font-mono font-medium text-rose-400">
                    ₹{Math.round(result.baseline.total_interest_paid).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Avalanche Card */}
            <div className={`rounded-xl p-3.5 flex flex-col gap-2 border ${
              result.recommended_strategy.includes("Avalanche")
                ? "bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30"
                : "bg-zinc-900/60 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-indigo-400" /> Debt Avalanche
                </span>
                {result.recommended_strategy.includes("Avalanche") && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                    Highest Interest First
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400">Mathematically minimizes interest paid</span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Debt-Free In:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {result.avalanche.months_to_debt_free} Months ({result.avalanche.months_saved_vs_baseline} Mo saved)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Interest:</span>
                  <span className="font-mono font-medium text-zinc-200">
                    ₹{Math.round(result.avalanche.total_interest_paid).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-indigo-900/60 pt-1">
                  <span className="text-indigo-300 font-medium">Interest Saved:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    ₹{Math.round(result.avalanche.interest_saved_vs_baseline).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Snowball Card */}
            <div className={`rounded-xl p-3.5 flex flex-col gap-2 border ${
              result.recommended_strategy.includes("Snowball")
                ? "bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/30"
                : "bg-zinc-900/60 border-zinc-800"
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Debt Snowball
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                  Smallest Balance First
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">Maximizes psychological momentum</span>
              <div className="mt-2 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Debt-Free In:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    {result.snowball.months_to_debt_free} Months ({result.snowball.months_saved_vs_baseline} Mo saved)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Total Interest:</span>
                  <span className="font-mono font-medium text-zinc-200">
                    ₹{Math.round(result.snowball.total_interest_paid).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between border-t border-blue-900/60 pt-1">
                  <span className="text-blue-300 font-medium">Interest Saved:</span>
                  <span className="font-mono font-semibold text-emerald-400">
                    ₹{Math.round(result.snowball.interest_saved_vs_baseline).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Takeaways */}
          {result.actionable_takeaways.length > 0 && (
            <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Quantitative Debt Advice
              </span>
              <ul className="list-disc list-inside text-xs text-indigo-200/90 space-y-1">
                {result.actionable_takeaways.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
