"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Compass,
} from "lucide-react";

interface HealthBreakdown {
  category: string;
  score: number;
  max_score: number;
  status: "EXCELLENT" | "GOOD" | "FAIR" | "CRITICAL";
  metrics: Record<string, any>;
  recommendation: string | null;
}

interface FinancialHealthData {
  composite_score: number;
  tier: "EXCELLENT" | "GOOD" | "FAIR" | "CRITICAL";
  breakdown: HealthBreakdown[];
  actionable_priorities: string[];
  net_worth_variance: {
    actual_net_worth: number;
    projected_net_worth: number;
    variance_amount: number;
    variance_pct: number;
    status: "AHEAD" | "ON_TRACK" | "BEHIND";
    narrative: string;
  } | null;
}

export default function FinancialHealthMonitor() {
  const [data, setData] = useState<FinancialHealthData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthScore = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/health/score", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load health score: ${res.status}`);
      }

      const scoreData = await res.json();
      setData(scoreData);
    } catch (err: any) {
      setError(err.message || "Failed to load financial health score.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthScore();
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "EXCELLENT":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
      case "GOOD":
        return "text-blue-400 bg-blue-500/10 border-blue-500/30";
      case "FAIR":
        return "text-amber-400 bg-amber-500/10 border-amber-500/30";
      default:
        return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 text-zinc-100 overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-400" />
          <h2 className="text-base font-semibold text-zinc-100">
            Composite Financial Health & Variance Monitor
          </h2>
        </div>
        <button
          onClick={fetchHealthScore}
          disabled={isLoading}
          className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-teal-300 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-zinc-400 text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
          Evaluating 100-point composite financial health...
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300">
          {error}
        </div>
      )}

      {data && !isLoading && (
        <div className="flex flex-col gap-4">
          {/* Top Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 p-4 rounded-xl items-center">
            {/* Big Score */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-teal-500/60 bg-teal-950/30 flex items-center justify-center flex-col shrink-0">
                <span className="text-xl font-bold font-mono text-teal-300">
                  {Math.round(data.composite_score)}
                </span>
                <span className="text-[9px] text-zinc-400">/ 100</span>
              </div>
              <div>
                <span className="text-[11px] text-zinc-400 block">Overall Health Grade</span>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border mt-1 ${getTierColor(data.tier)}`}>
                  {data.tier} RESILIENCE
                </span>
              </div>
            </div>

            {/* Variance Tracking */}
            <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-zinc-800/60 pt-3 md:pt-0 md:pl-4">
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-zinc-400" /> Milestone Tracking
              </span>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {data.net_worth_variance
                  ? data.net_worth_variance.narrative
                  : "Tracking aligned with baseline financial roadmap. No negative variance detected."}
              </p>
            </div>
          </div>

          {/* 4-Quadrant Pillar Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="bg-zinc-950/50 backdrop-blur-sm border border-zinc-800/60 rounded-xl p-3.5 flex flex-col justify-between gap-2.5 hover:border-zinc-700/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">{item.category}</span>
                  <span className="font-mono text-xs font-semibold text-teal-300">
                    {item.score} / {item.max_score}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.status === "EXCELLENT"
                        ? "bg-emerald-400"
                        : item.status === "GOOD"
                        ? "bg-blue-400"
                        : item.status === "FAIR"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${(item.score / item.max_score) * 100}%` }}
                  />
                </div>

                {item.recommendation && (
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {item.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Actionable Priorities */}
          {data.actionable_priorities.length > 0 && (
            <div className="bg-teal-950/20 backdrop-blur-sm border border-teal-800/40 rounded-xl p-3.5 flex flex-col gap-2">
              <span className="text-xs font-semibold text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> High-Priority Action Items
              </span>
              <ul className="list-disc list-inside text-xs text-teal-200/90 space-y-1">
                {data.actionable_priorities.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
