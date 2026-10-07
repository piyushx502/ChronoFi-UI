"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, FileText } from "lucide-react";

interface TaxResponse {
  new_regime_tax: number;
  new_regime_agri_rebate: number;
  old_regime_tax: number;
  old_regime_agri_rebate: number;
  recommendation: string;
}

const NEW_REGIME_SLABS = [
  { limit: 400000, rate: 0, label: "Up to ?4L" },
  { limit: 800000, rate: 5, label: "?4L - ?8L" },
  { limit: 1200000, rate: 10, label: "?8L - ?12L" },
  { limit: 1600000, rate: 15, label: "?12L - ?16L" },
  { limit: 2000000, rate: 20, label: "?16L - ?20L" },
  { limit: 2400000, rate: 25, label: "?20L - ?24L" },
  { limit: Infinity, rate: 30, label: "Above ?24L" }
];

export default function TaxBracketPage() {
  const [salary, setSalary] = useState<string>("1500000");
  const [deductions, setDeductions] = useState<string>("150000");
  const [agriIncome, setAgriIncome] = useState<string>("0");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TaxResponse | null>(null);

  useEffect(() => {
    // Attempt to prefill from profile
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/profile/me", { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data && data.base_salary) setSalary(data.base_salary.toString());
        })
        .catch(console.error);
    }
  }, []);

  const handleCalculate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/tax/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          salary: parseFloat(salary) || 0,
          deductions: parseFloat(deductions) || 0,
          agri_income: parseFloat(agriIncome) || 0
        })
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate on initial load after a short delay
  useEffect(() => {
    handleCalculate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const numSalary = parseFloat(salary) || 0;
  const currentSlabIndex = NEW_REGIME_SLABS.findIndex(slab => numSalary <= slab.limit);
  const effectiveSlabIndex = currentSlabIndex === -1 ? NEW_REGIME_SLABS.length - 1 : currentSlabIndex;

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col gap-6 relative z-10">
      <header className="mb-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Tax Planner</h1>
        <p className="text-sm text-zinc-400 mt-1">Optimize your tax liabilities using the latest FY 26-27 regime rules.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Form & Bracket Breakdown */}
        <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
          
          <motion.form 
            onSubmit={handleCalculate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border border-zinc-800/50 rounded-xl bg-zinc-900/30 backdrop-blur-sm"
          >
            <h3 className="text-lg font-medium text-zinc-100 mb-5 flex items-center">
              <Calculator className="w-5 h-5 mr-2 text-zinc-400" />
              Income Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Gross Salary (?)</label>
                <input 
                  type="number" 
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                  placeholder="e.g. 1500000"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Old Regime Deductions (80C, 80D, etc.)</label>
                <input 
                  type="number" 
                  value={deductions}
                  onChange={e => setDeductions(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                  placeholder="e.g. 150000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Agricultural Income (Optional)</label>
                <input 
                  type="number" 
                  value={agriIncome}
                  onChange={e => setAgriIncome(e.target.value)}
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all placeholder:text-zinc-600"
                  placeholder="e.g. 0"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-zinc-100 hover:bg-white text-zinc-950 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center disabled:opacity-70 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Recalculate Tax"}
              </button>
            </div>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 border border-zinc-800/50 rounded-xl bg-zinc-900/30 backdrop-blur-sm flex-1"
          >
            <h3 className="text-lg font-medium text-zinc-100 mb-5 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-zinc-400" />
              New Regime Slabs
            </h3>
            <div className="space-y-2">
              {NEW_REGIME_SLABS.map((slab, idx) => {
                const isActive = idx === effectiveSlabIndex;
                const isPassed = idx < effectiveSlabIndex;
                return (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      isActive 
                        ? "bg-zinc-800/60 border-zinc-700/50 shadow-sm" 
                        : isPassed 
                          ? "bg-zinc-900/20 border-transparent opacity-60" 
                          : "bg-transparent border-transparent opacity-40"
                    }`}
                  >
                    <span className={`text-sm font-medium ${isActive ? "text-zinc-100" : "text-zinc-400"}`}>
                      {slab.label}
                    </span>
                    <span className={`text-sm font-mono ${isActive ? "text-blue-400" : "text-zinc-500"}`}>
                      {slab.rate}%
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>

        </div>

        {/* Right Column: Comparison & Results */}
        <div className="lg:col-span-7 flex flex-col gap-6 min-h-0">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-6"
              >
                {/* Recommendation Banner */}
                <div className={`p-6 rounded-xl border flex items-center justify-between backdrop-blur-sm ${
                  result.recommendation === "New Regime" 
                    ? "bg-blue-950/20 border-blue-900/50" 
                    : "bg-emerald-950/20 border-emerald-900/50"
                }`}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">AI Recommendation</p>
                    <h2 className="text-2xl font-semibold text-zinc-100 flex items-center">
                      <ShieldCheck className={`w-6 h-6 mr-3 ${result.recommendation === "New Regime" ? "text-blue-400" : "text-emerald-400"}`} />
                      Opt for {result.recommendation}
                    </h2>
                    <p className="text-sm text-zinc-400 mt-2">
                      Based on your inputs, the {result.recommendation} minimizes your tax liability.
                    </p>
                  </div>
                </div>

                {/* Comparison Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* New Regime Card */}
                  <div className={`p-6 rounded-xl border backdrop-blur-sm relative overflow-hidden ${
                    result.recommendation === "New Regime" ? "bg-zinc-900/60 border-zinc-700 shadow-lg" : "bg-zinc-900/20 border-zinc-800/50"
                  }`}>
                    {result.recommendation === "New Regime" && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-800 border-b border-l border-zinc-700 rounded-bl-lg text-xs font-medium text-zinc-300">
                        Recommended
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-zinc-400 mb-6">New Tax Regime (FY 26-27)</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Standard Deduction</p>
                        <p className="text-sm font-medium text-zinc-300">?75,000</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Total Estimated Tax</p>
                        <p className="text-3xl font-mono text-zinc-100">{formatCurrency(result.new_regime_tax)}</p>
                      </div>
                      {result.new_regime_agri_rebate > 0 && (
                        <div className="pt-2 border-t border-zinc-800/50">
                          <p className="text-xs text-emerald-400 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Includes Agri Rebate: {formatCurrency(result.new_regime_agri_rebate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Old Regime Card */}
                  <div className={`p-6 rounded-xl border backdrop-blur-sm relative overflow-hidden ${
                    result.recommendation === "Old Regime" ? "bg-zinc-900/60 border-zinc-700 shadow-lg" : "bg-zinc-900/20 border-zinc-800/50"
                  }`}>
                    {result.recommendation === "Old Regime" && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-800 border-b border-l border-zinc-700 rounded-bl-lg text-xs font-medium text-zinc-300">
                        Recommended
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-zinc-400 mb-6">Old Tax Regime</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Declared Deductions</p>
                        <p className="text-sm font-medium text-zinc-300">{formatCurrency(parseFloat(deductions) || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Total Estimated Tax</p>
                        <p className="text-3xl font-mono text-zinc-100">{formatCurrency(result.old_regime_tax)}</p>
                      </div>
                      {result.old_regime_agri_rebate > 0 && (
                        <div className="pt-2 border-t border-zinc-800/50">
                          <p className="text-xs text-emerald-400 flex items-center">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Includes Agri Rebate: {formatCurrency(result.old_regime_agri_rebate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 border border-zinc-800/50 rounded-xl bg-zinc-900/20 backdrop-blur-sm mt-auto">
                  <p className="text-xs text-zinc-500 leading-relaxed text-center">
                    Tax calculations include the 4% Health & Education Cess. Calculations are for individual resident taxpayers below 60 years of age. Marginal relief and Sec 156 rebates are applied automatically if eligible.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/20 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                <RefreshCw className="w-6 h-6 text-zinc-700 animate-spin mb-4" />
                <p className="text-sm text-zinc-500">Calculating optimal tax strategy...</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
