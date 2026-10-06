"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import FinancialProfile from "./components/FinancialProfile";
import AIChat from "./components/AIChat";
import PredictiveChart from "./components/PredictiveChart";

export default function DashboardPage() {
  const [forecastData, setForecastData] = useState<unknown>(null);

  // This function is passed to the AIChat. When the AI finishes streaming its math calculation,
  // it bubbles up the JSON data here to draw the Recharts graph.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleForecastUpdate = (data: any) => {
    setForecastData(data);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Command Center</h1>
        <p className="text-sm text-zinc-400 mt-1">Real-time portfolio metrics and quantitative forecasting.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Financial Profile */}
        <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
          <FinancialProfile />
        </div>

        {/* Right Column: Chart (Top) & AI Chat (Bottom) */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-h-0">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-72 shrink-0 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm p-4 flex flex-col"
          >
            <h3 className="text-sm font-medium text-zinc-400 mb-4">LSTM Probabilistic Trajectory</h3>
            <div className="flex-1 min-h-0">
              <PredictiveChart data={forecastData} />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm overflow-hidden flex flex-col min-h-0"
          >
            <AIChat onForecastUpdate={handleForecastUpdate} />
          </motion.div>

        </div>
      </div>
    </div>
  );
}
