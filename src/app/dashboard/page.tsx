"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  MessageSquare,
  LineChart as ChartIcon,
  ShieldAlert,
  CreditCard,
  Activity,
} from "lucide-react";
import Link from "next/link";
import FinancialProfile from "./components/FinancialProfile";
import AIChat from "./components/AIChat";
import PredictiveChart from "./components/PredictiveChart";
import ScenarioComparison, { ScenarioResultData } from "./components/ScenarioComparison";

export default function DashboardPage() {
  const [simulationData, setSimulationData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "scenario">("chat");
  const [isSimulating, setIsSimulating] = useState(false);

  // Bubbles up scenario results from SSE chat or direct tool invocation
  const handleSimulationUpdate = (data: any) => {
    setSimulationData(data);
    if (data?.scenario_type) {
      setActiveTab("scenario");
    }
  };

  const handleRunScenario = async (params: {
    principal: number;
    rate: number;
    tenure: number;
    downPayment?: number;
  }) => {
    setIsSimulating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/v1/financial-scenarios/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scenario_type: "vehicle_loan",
          changes: {
            loan_principal: params.principal,
            annual_interest_rate: params.rate,
            loan_tenure_months: params.tenure,
            down_payment: params.downPayment || 0,
          },
          simulation_settings: {
            num_simulations: 1000,
            seed: 42,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationData(data);
        setActiveTab("scenario");
      }
    } catch (err) {
      console.error("Failed to run scenario:", err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
            ChronoFi Copilot Terminal
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Autonomous multi-agent financial planning, persistent conversational memory & Monte Carlo forecasting.
          </p>
        </div>

        {/* Clean Single-Row Controls */}
        <div className="flex items-center gap-2 self-start">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === "chat"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Quant Agent Chat
            </button>
            <button
              onClick={() => setActiveTab("scenario")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === "scenario"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              What-If Simulator
            </button>
          </div>

          <Link
            href="/dashboard/simulations"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            Simulation Studio ↗
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Authorized User Financial Profile */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          <FinancialProfile />
        </div>

        {/* Right Column: Chart (Top) & Interactive Simulator / Chat / Engines (Bottom) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          {/* Top Card: Multi-Scenario Trajectory Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-80 shrink-0 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-medium text-zinc-300">
                  {simulationData?.trajectory
                    ? "Baseline vs What-If Scenario Trajectory (CRN Monte Carlo)"
                    : "Probabilistic Portfolio Trajectory"}
                </h3>
              </div>
              {simulationData?.impact && (
                <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  Corpus Impact: -₹{(Math.abs(simulationData.impact.corpus_difference) / 100000).toFixed(1)}L
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <PredictiveChart data={simulationData} />
            </div>
          </motion.div>

          {/* Bottom Card: Switchable Feature Panels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-0"
          >
            {activeTab === "scenario" ? (
              <div className="p-4 flex-1 flex flex-col min-h-0 overflow-hidden">
                <ScenarioComparison
                  scenarioData={simulationData}
                  onRunScenario={handleRunScenario}
                  isLoading={isSimulating}
                />
              </div>
            ) : (
              <AIChat onForecastUpdate={handleSimulationUpdate} />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
