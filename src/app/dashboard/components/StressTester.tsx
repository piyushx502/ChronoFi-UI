"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Flame,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Layers,
  RefreshCw,
} from "lucide-react";

interface LiquidationStep {
  asset_name: string;
  asset_type: string;
  tier: number;
  initial_value: number;
  liquidated_amount: number;
  remaining_value: number;
  penalty_loss: number;
  penalty_rate: number;
}

interface StressTestResult {
  scenario_type: string;
  duration_months: number;
  monthly_burn_rate: number;
  total_liquidity_required: number;
  total_net_cash_raised: number;
  total_haircuts_and_penalties: number;
  solvent: boolean;
  insolvency_month: number | null;
  months_of_runway_remaining: number;
  liquidation_waterfall: LiquidationStep[];
  actionable_recommendations: string[];
}

export default function StressTester() {
  const [shockType, setShockType] = useState<"job_loss" | "salary_cut" | "lump_sum_emergency">("job_loss");
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [salaryCutPct, setSalaryCutPct] = useState<number>(30);
  const [emergencyExpense, setEmergencyExpense] = useState<number>(300000);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<StressTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunStressTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/stress/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shock_type: shockType,
          duration_months: durationMonths,
          salary_cut_percentage: salaryCutPct,
          lump_sum_emergency_expense: emergencyExpense,
        }),
      });

      if (!res.ok) {
        throw new Error(`Stress test failed with status ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to execute stress test.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 text-zinc-100 overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h2 className="text-base font-semibold text-zinc-100">
            Emergency Runway & Liquidity Shock Stress Tester
          </h2>
        </div>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
          4-Tier Liquidation Waterfall
        </span>
      </div>

      {/* Controls & Shock Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 text-xs">
        {/* Shock Type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 font-medium">Shock Scenario</label>
          <select
            value={shockType}
            onChange={(e) => setShockType(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
          >
            <option value="job_loss">Complete Job Loss (Zero Income)</option>
            <option value="salary_cut">Prolonged Salary Cut</option>
            <option value="lump_sum_emergency">Medical / Lump-Sum Shock</option>
          </select>
        </div>

        {/* Dynamic Parameter 1 */}
        {shockType === "job_loss" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 font-medium">Duration: {durationMonths} Months</label>
            <input
              type="range"
              min={1}
              max={18}
              value={durationMonths}
              onChange={(e) => setDurationMonths(Number(e.target.value))}
              className="accent-rose-500 mt-1 cursor-pointer"
            />
          </div>
        )}

        {shockType === "salary_cut" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 font-medium">Salary Reduction: {salaryCutPct}%</label>
              <input
                type="range"
                min={10}
                max={70}
                step={5}
                value={salaryCutPct}
                onChange={(e) => setSalaryCutPct(Number(e.target.value))}
                className="accent-rose-500 mt-1 cursor-pointer"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 font-medium">Duration: {durationMonths} Months</label>
              <input
                type="range"
                min={1}
                max={24}
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="accent-rose-500 mt-1 cursor-pointer"
              />
            </div>
          </>
        )}

        {shockType === "lump_sum_emergency" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 font-medium">Emergency Cost: ₹{(emergencyExpense / 100000).toFixed(1)}L</label>
            <input
              type="range"
              min={50000}
              max={1500000}
              step={50000}
              value={emergencyExpense}
              onChange={(e) => setEmergencyExpense(Number(e.target.value))}
              className="accent-rose-500 mt-1 cursor-pointer"
            />
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-end">
          <button
            onClick={handleRunStressTest}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium py-2 px-3 rounded-lg text-xs transition shadow-sm"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Simulating Shock...
              </>
            ) : (
              <>
                <Flame className="w-3.5 h-3.5" />
                Simulate Shock
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Solvency Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {result.solvent ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Solvent & Safe
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Insolvent at Month {result.insolvency_month}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Runway Remaining</span>
              <span className="text-base font-semibold font-mono text-zinc-100">
                {result.months_of_runway_remaining} Mo
              </span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Monthly Burn Rate</span>
              <span className="text-base font-semibold font-mono text-rose-400">
                ₹{Math.round(result.monthly_burn_rate).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col gap-1">
              <span className="text-[11px] text-zinc-400">Exit Frictions & Penalties</span>
              <span className="text-base font-semibold font-mono text-amber-400">
                ₹{Math.round(result.total_haircuts_and_penalties).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Liquidation Waterfall Breakdown */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold text-zinc-200">
                Priority Liquidation Waterfall (Tiers 1–4)
              </h3>
            </div>

            <div className="flex flex-col gap-2">
              {result.liquidation_waterfall.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-300">
                      T{step.tier}
                    </span>
                    <div>
                      <span className="font-medium text-zinc-200">{step.asset_name}</span>
                      <span className="text-[11px] text-zinc-400 ml-2 font-mono">
                        ({step.asset_type.toUpperCase()})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Liquidated</span>
                      <span className="font-mono text-zinc-200 font-semibold">
                        ₹{Math.round(step.liquidated_amount).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 block">Friction Cost</span>
                      <span className="font-mono text-rose-400">
                        {step.penalty_loss > 0 ? `-₹${Math.round(step.penalty_loss).toLocaleString("en-IN")}` : "₹0"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-zinc-400 block">Remaining</span>
                      <span className="font-mono text-emerald-400">
                        ₹{Math.round(step.remaining_value).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          {result.actionable_recommendations.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Recovery Strategy & Takeaways
              </span>
              <ul className="list-disc list-inside text-xs text-amber-200/90 space-y-1">
                {result.actionable_recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
