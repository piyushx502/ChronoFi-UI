"use client";

import { useState, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  Sliders,
  AlertCircle
} from "lucide-react";

interface GoalProfile {
  id: number;
  name: string;
  target_amount: number;
  target_years: number;
  priority: string;
}

interface ChaserResponse {
  target_amount: number;
  adjusted_target: number;
  timeline_years: number;
  current_savings: number;
  fv_existing: number;
  net_deficit: number;
  monthly_sip: number;
  step_up_starting_sip: number;
  total_outlay: number;
  wealth_gain: number;
  feasibility_score: number;
  feasibility_status: "Highly Feasible" | "Moderate Target" | "Challenging Horizon";
  allocation: { equity: number; debt: number; gold: number };
  milestones: Array<{
    percent: number;
    label: string;
    year: number;
    projectedAmount: number;
  }>;
}

const PRESET_RETURNS = [
  { label: "Conservative (7%)", value: 7, desc: "Fixed income & debt funds" },
  { label: "Balanced (11%)", value: 11, desc: "Diversified index & flexicap" },
  { label: "Aggressive (14%)", value: 14, desc: "High-growth equities & quant" },
];

export default function GoalChaserPage() {
  const [profileGoals, setProfileGoals] = useState<GoalProfile[]>([]);
  const [selectedGoalName, setSelectedGoalName] = useState<string>("Buy a Car");
  const [targetAmount, setTargetAmount] = useState<string>("1000000");
  const [years, setYears] = useState<string>("3");
  const [currentSavings, setCurrentSavings] = useState<string>("50000");
  const [returnRate, setReturnRate] = useState<number>(11);
  const [applyInflation, setApplyInflation] = useState<boolean>(true);
  const [monthlyCapacity, setMonthlyCapacity] = useState<string>("35000");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ChaserResponse | null>(null);
  const inflationCheckboxId = useId();

  // Load user profile & pre-fill active goals
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            if (data.monthly_investable_surplus) {
              setMonthlyCapacity(Math.round(data.monthly_investable_surplus).toString());
            } else if (data.base_salary) {
              setMonthlyCapacity(Math.round(data.base_salary * 0.35).toString());
            }
            if (data.assets && data.assets.length > 0) {
              const liquid = data.assets.find((a: { asset_type: string; current_value: number }) => a.asset_type === "Cash") || data.assets[0];
              if (liquid) setCurrentSavings(liquid.current_value.toString());
            }
            if (data.goals && data.goals.length > 0) {
              setProfileGoals(data.goals);
              const first = data.goals[0];
              setSelectedGoalName(first.name);
              setTargetAmount(first.target_amount.toString());
              setYears(first.target_years.toString());
            }
          }
        })
        .catch(console.error);
    }
  }, []);

  const handleSelectPresetGoal = (g: GoalProfile) => {
    setSelectedGoalName(g.name);
    setTargetAmount(g.target_amount.toString());
    setYears(g.target_years.toString());
  };

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/goals/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_amount: parseFloat(targetAmount) || 0,
          years: parseFloat(years) || 1,
          current_savings: parseFloat(currentSavings) || 0,
          expected_return_rate: returnRate,
          inflation_rate: 6,
          apply_inflation: applyInflation,
          monthly_savings_capacity: parseFloat(monthlyCapacity) || 35000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation trigger
  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGoalName, returnRate, applyInflation]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6 relative z-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800/40">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Target className="w-6 h-6" />
            </span>
            Goal Chaser
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Reverse-engineer required monthly capital, step-up trajectories, and milestone acceleration.
          </p>
        </div>

        {/* Quick Goal Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {profileGoals.map((g) => {
            const isSelected = selectedGoalName === g.name;
            return (
              <button
                key={g.id}
                onClick={() => handleSelectPresetGoal(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm"
                    : "bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700"
                }`}
              >
                {g.name} ({g.target_years}y)
              </button>
            );
          })}
          <button
            onClick={() => {
              setSelectedGoalName("Custom Target");
              setTargetAmount("2500000");
              setYears("5");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedGoalName === "Custom Target"
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm"
                : "bg-zinc-900/60 text-zinc-400 border border-zinc-800/80 hover:text-zinc-200"
            }`}
          >
            + Custom Goal
          </button>
        </div>
      </header>

      {/* Main Grid: Form Left, Analytics Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Input Parameters */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          <motion.form
            onSubmit={handleCalculate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border border-zinc-800/50 rounded-xl bg-zinc-900/30 backdrop-blur-sm space-y-4"
          >
            <h3 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-zinc-400" />
              Goal Parameters
            </h3>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Goal Identifier
              </label>
              <input
                type="text"
                value={selectedGoalName}
                onChange={(e) => setSelectedGoalName(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-medium"
                placeholder="e.g. Dream House, European Trip, Car"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Target Amount (₹)
              </label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono"
                placeholder="e.g. 1000000"
              />
              <p className="text-[11px] text-zinc-500 mt-1 font-mono">
                Formatted: {formatCurrency(parseFloat(targetAmount) || 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Timeline (Years)
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="35"
                  step="0.5"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Initial Seed Corpus (₹)
                </label>
                <input
                  type="number"
                  value={currentSavings}
                  onChange={(e) => setCurrentSavings(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Expected Return Presets */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Expected Annual Return: <span className="text-blue-400 font-mono font-semibold">{returnRate}%</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_RETURNS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setReturnRate(p.value)}
                    className={`p-2 rounded-lg border text-left transition-all ${
                      returnRate === p.value
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-200"
                        : "bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-xs font-medium">{p.value}%</div>
                    <div className="text-[10px] text-zinc-500 truncate">{p.label.split(" ")[0]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Inflation Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/80">
              <label htmlFor={inflationCheckboxId} className="cursor-pointer">
                <p className="text-xs font-medium text-zinc-200">Adjust for Inflation (+6% CPI)</p>
                <p className="text-[11px] text-zinc-500">Calculate real future purchasing power</p>
              </label>
              <input
                id={inflationCheckboxId}
                type="checkbox"
                checked={applyInflation}
                onChange={(e) => setApplyInflation(e.target.checked)}
                className="w-4 h-4 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-zinc-950 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Recalculate Chaser Strategy
                </>
              )}
            </button>
          </motion.form>

          {/* Allocation Recommendation Card */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 border border-zinc-800/50 rounded-xl bg-zinc-900/30 backdrop-blur-sm"
            >
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Recommended Asset Allocation</span>
                <span className="text-zinc-500 font-mono text-[11px]">{result.timeline_years}Y Horizon</span>
              </h4>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden flex mb-3">
                <div style={{ width: `${result.allocation.equity}%` }} className="bg-blue-500" title="Equity" />
                <div style={{ width: `${result.allocation.debt}%` }} className="bg-emerald-500" title="Debt" />
                <div style={{ width: `${result.allocation.gold}%` }} className="bg-amber-400" title="Gold/Cash" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                  <span className="block text-blue-400 font-semibold">{result.allocation.equity}%</span>
                  <span className="text-[10px] text-zinc-500">Equity Index</span>
                </div>
                <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                  <span className="block text-emerald-400 font-semibold">{result.allocation.debt}%</span>
                  <span className="text-[10px] text-zinc-500">Debt & G-Secs</span>
                </div>
                <div className="p-2 rounded bg-zinc-950/40 border border-zinc-800/60">
                  <span className="block text-amber-400 font-semibold">{result.allocation.gold}%</span>
                  <span className="text-[10px] text-zinc-500">Gold / Liquid</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Quantitative Output */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6"
              >
                {/* Feasibility Hero Banner */}
                <div
                  className={`p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm ${
                    result.feasibility_status === "Highly Feasible"
                      ? "bg-emerald-950/20 border-emerald-900/50"
                      : result.feasibility_status === "Moderate Target"
                      ? "bg-blue-950/20 border-blue-900/50"
                      : "bg-amber-950/20 border-amber-900/50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck
                        className={`w-5 h-5 ${
                          result.feasibility_status === "Highly Feasible"
                            ? "text-emerald-400"
                            : result.feasibility_status === "Moderate Target"
                            ? "text-blue-400"
                            : "text-amber-400"
                        }`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                        {result.feasibility_status}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-100">
                      Chase Score: {result.feasibility_score}%
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">
                      Target requires accumulating {formatCurrency(result.net_deficit)} beyond your current compounding seed corpus.
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-zinc-800/80 sm:pl-6 shrink-0">
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Required Monthly SIP</p>
                    <p className="text-3xl font-bold font-mono text-zinc-100 mt-0.5 text-blue-400">
                      {formatCurrency(result.monthly_sip)}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">/ month for {result.timeline_years} years</p>
                  </div>
                </div>

                {/* Strategy Acceleration Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fixed SIP Strategy */}
                  <div className="p-5 border border-zinc-800/60 rounded-xl bg-zinc-900/30 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        Fixed Constant SIP
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Standard</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500">Monthly Contribution</p>
                        <p className="text-2xl font-bold font-mono text-zinc-100">
                          {formatCurrency(result.monthly_sip)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/40 text-xs">
                        <div>
                          <span className="text-zinc-500 block">Total Invested</span>
                          <span className="text-zinc-300 font-mono font-medium">{formatCurrency(result.total_outlay)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Wealth Gain</span>
                          <span className="text-emerald-400 font-mono font-medium">+{formatCurrency(result.wealth_gain)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step-Up SIP Strategy */}
                  <div className="p-5 border border-blue-900/40 rounded-xl bg-blue-950/10 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                        Step-Up SIP (+10% / yr)
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/40">
                        Accelerated
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500">Year 1 Monthly Start</p>
                        <p className="text-2xl font-bold font-mono text-emerald-400">
                          {formatCurrency(result.step_up_starting_sip)}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/40 text-xs text-zinc-400">
                        <p className="leading-relaxed">
                          Start with <span className="text-zinc-200 font-medium">{formatCurrency(result.monthly_sip - result.step_up_starting_sip)} less/month</span> today, scaling by 10% each year as salary increments roll in.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone Trajectory Road */}
                <div className="p-5 border border-zinc-800/50 rounded-xl bg-zinc-900/30 backdrop-blur-sm">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Milestone Arrival Trajectory
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {result.milestones.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-800/60 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-zinc-300">{m.label}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="text-base font-bold font-mono text-zinc-100 my-1">
                          {formatCurrency(m.projectedAmount)}
                        </div>
                        <div className="text-[11px] text-zinc-500 font-mono">
                          Year ~{m.year}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Quant Insight */}
                <div className="p-5 border border-zinc-800/60 rounded-xl bg-gradient-to-r from-zinc-900/40 via-zinc-900/20 to-blue-950/20 backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-200">Quant Execution Rule</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        To hit <span className="text-zinc-200 font-medium">{formatCurrency(result.adjusted_target)}</span> in <span className="text-zinc-200 font-medium">{result.timeline_years} years</span>, maintain systematic deployment on the 1st of every month. Transition 20% of equity gains into liquid sovereign funds 6 months prior to goal maturity to lock in capital and insulate against market downturns.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/20 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                <RefreshCw className="w-6 h-6 text-zinc-700 animate-spin mb-4" />
                <p className="text-sm text-zinc-500">Formulating optimal goal chaser trajectory...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
