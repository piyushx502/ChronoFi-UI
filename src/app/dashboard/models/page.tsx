"use client";

import { motion } from "framer-motion";
import { Zap, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const MODELS = [
  {
    name: "Common Random Numbers (CRN) Monte Carlo",
    type: "Variance Reduction Simulation",
    status: "Active (500-1,000 Paths)",
    description: "Evaluates retirement corpus trajectory across baseline and scenario branches using paired pseudorandom seed streams to isolate decision impact with zero stochastic noise.",
    accuracy: "99.4% Confidence Interval",
  },
  {
    name: "PyTorch LSTM Forecaster",
    type: "Deep Learning Sequence Model",
    status: "Active (Probabilistic Goal Hit %)",
    description: "Multi-layer LSTM trained on macroeconomic inflation and equity market trajectories to predict goal attainment probabilities over 5-30 year horizons.",
    accuracy: "Evaluated on Historical NIFTY 50",
  },
  {
    name: "Deterministic Debt Amortizer",
    type: "Avalanche vs Snowball Engine",
    status: "Active (Monthly Prepayments)",
    description: "Strict closed-form compound interest solver comparing APR-ordered avalanche payoffs against balance-ordered snowball payoff momentum.",
    accuracy: "Exact Mathematical Precision (0% LLM)",
  },
  {
    name: "4-Tier Liquidation Waterfall",
    type: "Liquidity Stress Tester",
    status: "Active (Finance Act 2024)",
    description: "Simulates survival runway under prolonged unemployment, income reductions, and medical shocks across Cash, Term Deposits, Debt, and Equity friction tiers.",
    accuracy: "Institutional Insolvency Modeling",
  },
];

export default function ModelsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6 text-zinc-100">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              Quantitative Models & Engine Registry
            </h1>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Deterministic AI
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            ChronoFi quantitative mathematical engines, variance reduction algorithms, and machine learning forecasters.
          </p>
        </div>

        <Link
          href="/dashboard/simulations"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 active:scale-[0.99] transition-all shadow-sm self-start group"
        >
          <Zap className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
          <span>Launch Simulation Studio</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODELS.map((model, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between gap-3 backdrop-blur-sm"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-zinc-400">{model.type}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {model.status}
                </span>
              </div>
              <h3 className="text-base font-semibold text-zinc-100">{model.name}</h3>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                {model.description}
              </p>
            </div>

            <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Benchmark:</span>
              <span className="font-mono text-zinc-300">{model.accuracy}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
