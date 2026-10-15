"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Compass,
  X,
  Target,
  CreditCard,
  ShieldAlert,
  Calculator,
  SlidersHorizontal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
} from "lucide-react";
import { useModeIntelligence, ModeScore } from "@/app/context/ModeIntelligenceContext";

function getModeIcon(id: string) {
  switch (id) {
    case "goals":
      return Target;
    case "debt":
      return CreditCard;
    case "stress":
      return ShieldAlert;
    case "tax":
      return Calculator;
    case "simulator":
      return SlidersHorizontal;
    case "health":
    default:
      return Activity;
  }
}

function getUrgencyBadge(urgency: ModeScore["urgencyLevel"]) {
  switch (urgency) {
    case "critical":
      return {
        label: "Critical Action Needed",
        style: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        dotColor: "bg-rose-500",
      };
    case "warning":
      return {
        label: "Attention Recommended",
        style: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        dotColor: "bg-amber-500",
      };
    case "opportunity":
      return {
        label: "High Leverage Opportunity",
        style: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        dotColor: "bg-emerald-500",
      };
    case "optimal":
    default:
      return {
        label: "Balanced & Optimized",
        style: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        dotColor: "bg-blue-500",
      };
  }
}

export function AutonomousModeBanner() {
  const router = useRouter();
  const {
    recommendedMode,
    setIsRadarOpen,
    isAutopilotActive,
    isBannerDismissed,
    dismissBanner,
  } = useModeIntelligence();

  if (isBannerDismissed || !isAutopilotActive) return null;

  const Icon = getModeIcon(recommendedMode.id);
  const badge = getUrgencyBadge(recommendedMode.urgencyLevel);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-6 mt-4 p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md relative overflow-hidden shadow-sm"
    >
      {/* Ambient gradient highlight */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 relative z-10">
        {/* Left: AI Autopilot Status & Rationale */}
        <div className="flex items-start md:items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-zinc-400 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor} animate-pulse`} />
                ChronoFi Mode Autopilot
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-medium ${badge.style}`}>
                {recommendedMode.matchScore}% Balance Match
              </span>
              <span className="text-xs text-zinc-300 font-medium font-sans">
                ChronoFi chose: <strong className="text-zinc-100">{recommendedMode.name}</strong>
              </span>
            </div>

            <p className="text-xs text-zinc-400 line-clamp-1 max-w-3xl">
              {recommendedMode.reason}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={() => setIsRadarOpen(true)}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 transition-colors"
            title="Inspect how ChronoFi evaluated all modes"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Mode Radar</span>
          </button>

          <button
            onClick={() => router.push(recommendedMode.href)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white transition-all shadow-sm active:scale-[0.98]"
          >
            <span>{recommendedMode.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={dismissBanner}
            type="button"
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-md transition-colors"
            title="Dismiss until next session"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ModeRadarModal() {
  const router = useRouter();
  const {
    allModes,
    recommendedMode,
    isRadarOpen,
    setIsRadarOpen,
    isAutopilotActive,
    toggleAutopilot,
    profileSummary,
  } = useModeIntelligence();

  if (!isRadarOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsRadarOpen(false)}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-center shadow-inner">
                <Compass className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                    ChronoFi Autonomous Mode Radar
                  </h2>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Live Balance Triage
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ChronoFi continuously inspects your balance sheet to prioritize which financial mode gives you the highest leverage.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRadarOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Balance Sheet Metrics Summary Bar */}
          <div className="px-6 py-3 bg-zinc-900/60 border-b border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Runway Buffer</span>
              <span className={`font-mono font-semibold ${profileSummary.runway < 3 ? "text-rose-400" : "text-zinc-200"}`}>
                {profileSummary.runway} Months
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Investable Surplus</span>
              <span className="font-mono font-semibold text-emerald-400">
                ₹{profileSummary.surplus.toLocaleString('en-IN')}/mo
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Debt-to-Income (DTI)</span>
              <span className={`font-mono font-semibold ${profileSummary.dti > 30 ? "text-amber-400" : "text-zinc-200"}`}>
                {profileSummary.dti}%
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-mono">Total Debt Drag</span>
              <span className="font-mono font-semibold text-zinc-200">
                ₹{profileSummary.debt.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Ranked Modes List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5 custom-scrollbar">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span>Modes Ranked by Financial Priority</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Autopilot Guidance:</span>
                <button
                  type="button"
                  onClick={toggleAutopilot}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded transition ${
                    isAutopilotActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  }`}
                >
                  {isAutopilotActive ? "ENABLED" : "PAUSED"}
                </button>
              </div>
            </div>

            {allModes.map((mode, index) => {
              const Icon = getModeIcon(mode.id);
              const isTopPick = index === 0;
              const badge = getUrgencyBadge(mode.urgencyLevel);

              return (
                <div
                  key={mode.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isTopPick
                      ? "bg-zinc-900/70 border-emerald-500/40 shadow-sm ring-1 ring-emerald-500/20"
                      : "bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-900/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isTopPick
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                            {mode.name}
                            {isTopPick && (
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                #1 ChronoFi Pick
                              </span>
                            )}
                          </h3>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded border font-medium ${badge.style}`}>
                            {badge.label}
                          </span>
                        </div>

                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                          {mode.reason}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {mode.tags.map((t) => (
                            <span key={t} className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Score Bar & Action Button */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800/60">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-zinc-200">
                          {mode.matchScore}%
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Match Score</span>
                      </div>

                      <button
                        onClick={() => {
                          setIsRadarOpen(false);
                          router.push(mode.href);
                        }}
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition ${
                          isTopPick
                            ? "bg-zinc-100 text-zinc-950 hover:bg-white font-semibold"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
                        }`}
                      >
                        <span>{mode.actionLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              Dynamic triage recalculates automatically whenever balance sheet numbers change.
            </span>
            <button
              onClick={() => setIsRadarOpen(false)}
              className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function TerminalModeDispatcherCard() {
  const router = useRouter();
  const { recommendedMode, allModes, setIsRadarOpen } = useModeIntelligence();
  const Icon = getModeIcon(recommendedMode.id);
  const badge = getUrgencyBadge(recommendedMode.urgencyLevel);

  const runnerUp = allModes[1];
  const RunnerUpIcon = runnerUp ? getModeIcon(runnerUp.id) : null;

  return (
    <div className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/30 backdrop-blur-sm flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                ChronoFi Mode Autopilot
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">
                Self-Choosing Financial Priority
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsRadarOpen(true)}
            className="text-[11px] font-mono text-zinc-400 hover:text-zinc-200 underline decoration-zinc-700 hover:decoration-zinc-400 transition"
          >
            Inspect Mode Radar
          </button>
        </div>

        {/* Primary Recommendation Showcase */}
        <div className="mt-3 p-3.5 rounded-lg bg-zinc-950/70 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-100">
                {recommendedMode.name}
              </span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.style}`}>
              {recommendedMode.matchScore}% Match
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            {recommendedMode.reason}
          </p>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-400">
              Key Metric: <strong className="text-zinc-200">{recommendedMode.keyMetric}</strong>
            </span>
            <button
              onClick={() => router.push(recommendedMode.href)}
              className="flex items-center gap-1 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white px-2.5 py-1 rounded-md transition shadow-sm"
            >
              <span>{recommendedMode.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Secondary Mode Pill if available */}
        {runnerUp && (
          <div className="mt-2.5 px-3 py-2 rounded-lg bg-zinc-900/40 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              {RunnerUpIcon && <RunnerUpIcon className="w-3.5 h-3.5 text-zinc-400" />}
              <span>Secondary: <strong className="text-zinc-300">{runnerUp.name}</strong></span>
              <span className="text-[10px] font-mono text-zinc-500">({runnerUp.matchScore}%)</span>
            </div>
            <button
              onClick={() => router.push(runnerUp.href)}
              className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 font-medium transition"
            >
              <span>Open</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
