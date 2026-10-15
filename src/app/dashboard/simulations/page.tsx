"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  ShieldAlert,
  CreditCard,
  Activity,
  LineChart as ChartIcon,
} from "lucide-react";
import FinancialProfile from "../components/FinancialProfile";
import PredictiveChart from "../components/PredictiveChart";
import ScenarioComparison from "../components/ScenarioComparison";
import StressTester from "../components/StressTester";
import DebtPayoffOptimizer from "../components/DebtPayoffOptimizer";
import FinancialHealthMonitor from "../components/FinancialHealthMonitor";

type SimulationTab = "scenario" | "stress" | "debt" | "health";

export default function SimulationsStudioPage() {
  const [activeTab, setActiveTab] = useState<SimulationTab>("scenario");
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SimulationTab;
      if (tabParam && ["scenario", "stress", "debt", "health"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

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
      {/* Header with Title and Single-Row Tab Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
              Simulation Studio
            </h1>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              Quantitative Engines
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Institutional What-If scenario modeling, 4-tier liquidity stress testing, debt acceleration, and health scoring.
          </p>
        </div>

        {/* Dedicated Single-Row Tab Navigation */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 self-start shadow-sm">
          <button
            onClick={() => setActiveTab("scenario")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "scenario"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            What-If Simulator
          </button>
          <button
            onClick={() => setActiveTab("stress")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "stress"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            Stress Tester
          </button>
          <button
            onClick={() => setActiveTab("debt")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "debt"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            Debt Accelerator
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeTab === "health"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Health Score
          </button>
        </div>
      </header>

      {/* Main Studio Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column: Financial Profile Summary */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          <FinancialProfile />
        </div>

        {/* Right Column: Chart (Top) & Selected Engine View (Bottom) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          {/* Top Card: Multi-Scenario Trajectory Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="h-72 shrink-0 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChartIcon className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-medium text-zinc-300">
                  {simulationData?.trajectory
                    ? "Baseline vs Modified Scenario Trajectory (CRN Monte Carlo)"
                    : "Probabilistic Wealth & Goal Trajectory"}
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

          {/* Bottom Card: The Selected Simulation Engine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex-1 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-0 p-4"
          >
            {activeTab === "scenario" && (
              <ScenarioComparison
                scenarioData={simulationData}
                onRunScenario={handleRunScenario}
                isLoading={isSimulating}
              />
            )}
            {activeTab === "stress" && <StressTester />}
            {activeTab === "debt" && <DebtPayoffOptimizer />}
            {activeTab === "health" && <FinancialHealthMonitor />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
