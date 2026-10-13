"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Wallet, CreditCard, Target, RefreshCw, Plus, Trash2, Edit3, Check, X, ShieldAlert, ArrowUpRight } from "lucide-react";
import InteractiveCat from "../../components/InteractiveCat";

interface Profile {
  id: number;
  name: string;
  email: string;
  age: number;
  base_salary: number;
  monthly_expenses: number;
  net_worth: number;
  monthly_investable_surplus: number;
  months_of_runway: number;
  assets: { id: number; name: string; current_value: number; asset_type: string; expected_return_rate?: number }[];
  liabilities: { id: number; name: string; principal_remaining: number; interest_rate: number; monthly_payment: number }[];
  goals: { id: number; name: string; target_amount: number; target_years: number; priority?: string }[];
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      onRetry();
      setIsRetrying(false);
    }, 600);
  };

  return (
    <motion.div 
      key="error" 
      exit={{ opacity: 0, scale: 0.95 }} 
      transition={{ duration: 0.2 }} 
      className="flex-1 border border-zinc-800/50 rounded-xl bg-zinc-900/20 p-8 flex flex-col items-center justify-center text-center backdrop-blur-sm z-10 relative"
    >
      <div className="relative w-full max-w-[250px] aspect-square mx-auto mb-2 select-none z-10">
        <InteractiveCat />
      </div>

      <div className="text-center w-full px-2 -mt-12 relative z-20">
        <h3 
          className="text-zinc-100 font-black mb-1 text-lg tracking-tight font-sans"
          style={{
            textShadow: "1px 1px 0 #71717a, 2px 2px 0 #71717a, 3px 3px 0 #52525b, 4px 4px 0 #52525b, 5px 5px 15px rgba(0,0,0,0.9)"
          }}
        >
          Connection Lost
        </h3>
        <p 
          className="text-zinc-100 text-[10px] font-black tracking-widest uppercase leading-tight max-w-[180px] mx-auto mt-1"
          style={{ textShadow: "1px 1px 0 #71717a, 2px 2px 0 #52525b, 3px 3px 10px rgba(0,0,0,0.8)" }}
        >
          {error || "Unable to establish connection to the data stream."}
        </p>
      </div>
      
      <motion.button 
        onClick={handleRetry}
        disabled={isRetrying}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="text-xs flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2.5 rounded-md transition-colors border border-zinc-700/50 shadow-sm font-medium mt-4 disabled:opacity-80"
      >
        <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
        {isRetrying ? "Retrying..." : "Retry"}
      </motion.button>
    </motion.div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 40, stiffness: 100 });
  
  useEffect(() => {
    motionValue.set(value || 0);
  }, [motionValue, value]);

  const display = useTransform(springValue, (latest) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(latest)
  );

  return <motion.span>{display}</motion.span>;
}

export default function FinancialProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Edit Expense / Salary State
  const [isEditingCashflow, setIsEditingCashflow] = useState(false);
  const [editExpenses, setEditExpenses] = useState("");
  const [editSalary, setEditSalary] = useState("");
  const [isSavingCashflow, setIsSavingCashflow] = useState(false);

  // New Item Modals
  const [activeModal, setActiveModal] = useState<"asset" | "liability" | "goal" | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("Equity");
  const [assetValue, setAssetValue] = useState("");
  const [assetReturn, setAssetReturn] = useState("12");

  const [liabName, setLiabName] = useState("");
  const [liabPrincipal, setLiabPrincipal] = useState("");
  const [liabRate, setLiabRate] = useState("9");
  const [liabEMI, setLiabEMI] = useState("");

  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalYears, setGoalYears] = useState("5");
  const [goalPriority, setGoalPriority] = useState("Essential");

  const fetchProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/";
        }
        throw new Error("Failed to fetch profile");
      }
      const data = await res.json();
      setProfile(data);
      setEditExpenses(String(data.monthly_expenses || 0));
      setEditSalary(String(data.base_salary || 0));
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveCashflow = async () => {
    setIsSavingCashflow(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          base_salary: parseFloat(editSalary) || profile?.base_salary,
          monthly_expenses: parseFloat(editExpenses) || 0,
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditingCashflow(false);
      }
    } catch (err) {
      console.error("Failed to update cash flow:", err);
    } finally {
      setIsSavingCashflow(false);
    }
  };

  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: assetName,
          asset_type: assetType,
          current_value: parseFloat(assetValue) || 0,
          expected_return_rate: (parseFloat(assetReturn) || 10) / 100,
        })
      });
      if (res.ok) {
        setActiveModal(null);
        setAssetName("");
        setAssetValue("");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAsset = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/profile/assets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile/liabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: liabName,
          principal_remaining: parseFloat(liabPrincipal) || 0,
          interest_rate: (parseFloat(liabRate) || 9) / 100,
          monthly_payment: parseFloat(liabEMI) || 0,
        })
      });
      if (res.ok) {
        setActiveModal(null);
        setLiabName("");
        setLiabPrincipal("");
        setLiabEMI("");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLiability = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/profile/liabilities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: goalName,
          target_amount: parseFloat(goalAmount) || 0,
          target_years: parseInt(goalYears) || 5,
          priority: goalPriority,
          inflation_rate: 0.06,
        })
      });
      if (res.ok) {
        setActiveModal(null);
        setGoalName("");
        setGoalAmount("");
        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/profile/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  const totalAssets = profile?.assets.reduce((sum, a) => sum + a.current_value, 0) || 0;
  const totalLiabilities = profile?.liabilities.reduce((sum, l) => sum + l.principal_remaining, 0) || 0;

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div key="loading" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="flex-1 border border-zinc-800 rounded-xl bg-zinc-950/50 backdrop-blur-sm p-6 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-zinc-500 animate-spin" />
        </motion.div>
      ) : error || !profile ? (
        <ErrorState error={error} onRetry={fetchProfile} />
      ) : (
        <motion.div 
          key="content"
          initial="hidden"
          animate="show"
          exit={{ opacity: 0, y: 10 }}
          variants={container}
          className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar"
        >
          {/* Identity & Net Worth Card */}
          <motion.div variants={item} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-100">{profile.name}</h2>
                <p className="text-xs text-zinc-500">{profile.email} • Age {profile.age}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Net Worth</p>
                <p className="text-sm font-semibold text-emerald-400 font-mono">
                  <AnimatedCounter value={profile.net_worth} />
                </p>
              </div>
            </div>

            {/* Cash Flow Summary & Runway Gauge */}
            <div className="border-t border-zinc-800/60 pt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Monthly Living Expenses:</span>
                {isEditingCashflow ? (
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number"
                      value={editExpenses}
                      onChange={(e) => setEditExpenses(e.target.value)}
                      className="w-24 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-zinc-100 font-mono"
                    />
                    <button onClick={handleSaveCashflow} disabled={isSavingCashflow} className="p-1 text-emerald-400 hover:text-emerald-300">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsEditingCashflow(false)} className="p-1 text-zinc-500 hover:text-zinc-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-zinc-200">
                      {profile.monthly_expenses > 0 ? formatCurrency(profile.monthly_expenses) : "Unset (est. 40%)"}
                    </span>
                    <button onClick={() => setIsEditingCashflow(true)} className="p-1 text-zinc-500 hover:text-zinc-300">
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Investable Surplus:</span>
                <span className="font-mono font-medium text-amber-300">
                  {formatCurrency(profile.monthly_investable_surplus)}/mo
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Emergency Runway:</span>
                <span className={`font-mono text-[11px] px-2 py-0.5 rounded border ${
                  profile.months_of_runway >= 6
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : profile.months_of_runway >= 3
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                }`}>
                  {profile.months_of_runway} Months
                </span>
              </div>
            </div>
          </motion.div>

          {/* Assets Section */}
          <motion.div variants={item} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-emerald-400">
                <Wallet className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Assets</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">{formatCurrency(totalAssets)}</span>
                <button 
                  onClick={() => setActiveModal("asset")}
                  className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white transition"
                  title="Add Asset"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {activeModal === "asset" && (
              <form onSubmit={handleAddAsset} className="mb-3 p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <input 
                  type="text" 
                  placeholder="Asset Name (e.g. Mutual Funds)" 
                  value={assetName} 
                  onChange={e => setAssetName(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100" 
                  required 
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Value (₹)" 
                    value={assetValue} 
                    onChange={e => setAssetValue(e.target.value)} 
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100 font-mono" 
                    required 
                  />
                  <select 
                    value={assetType} 
                    onChange={e => setAssetType(e.target.value)} 
                    className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100"
                  >
                    <option value="Equity">Equity</option>
                    <option value="Cash">Cash / FD</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Gold">Gold</option>
                  </select>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">Cancel</button>
                  <button type="submit" className="px-2 py-1 rounded bg-emerald-600 text-white">Save</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {profile.assets.map(a => (
                <div key={a.id} className="flex justify-between items-center group py-1 text-xs">
                  <div>
                    <p className="text-zinc-200">{a.name}</p>
                    <p className="text-[10px] text-zinc-500 capitalize">{a.asset_type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-zinc-300 font-mono">{formatCurrency(a.current_value)}</p>
                    <button 
                      onClick={() => handleDeleteAsset(a.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Liabilities Section */}
          <motion.div variants={item} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-rose-400">
                <CreditCard className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Liabilities</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">{formatCurrency(totalLiabilities)}</span>
                <button 
                  onClick={() => setActiveModal("liability")}
                  className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white transition"
                  title="Add Liability"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {activeModal === "liability" && (
              <form onSubmit={handleAddLiability} className="mb-3 p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <input 
                  type="text" 
                  placeholder="Loan Name (e.g. Car Loan)" 
                  value={liabName} 
                  onChange={e => setLiabName(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100" 
                  required 
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Principal (₹)" 
                    value={liabPrincipal} 
                    onChange={e => setLiabPrincipal(e.target.value)} 
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100 font-mono" 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="EMI (₹)" 
                    value={liabEMI} 
                    onChange={e => setLiabEMI(e.target.value)} 
                    className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100 font-mono" 
                    required 
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">Cancel</button>
                  <button type="submit" className="px-2 py-1 rounded bg-rose-600 text-white">Save</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {profile.liabilities.map(l => (
                <div key={l.id} className="flex justify-between items-center group py-1 text-xs">
                  <div>
                    <p className="text-zinc-200">{l.name}</p>
                    <p className="text-[10px] text-zinc-500">{(l.interest_rate * 100).toFixed(1)}% APR • ₹{l.monthly_payment?.toLocaleString('en-IN') || 0}/mo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-zinc-300 font-mono">{formatCurrency(l.principal_remaining)}</p>
                    <button 
                      onClick={() => handleDeleteLiability(l.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      title="Delete Liability"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Goals Section */}
          <motion.div variants={item} className="p-4 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center text-blue-400">
                <Target className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Life Goals</h3>
              </div>
              <button 
                onClick={() => setActiveModal("goal")}
                className="p-1 rounded bg-zinc-800 text-zinc-300 hover:text-white transition"
                title="Add Goal"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeModal === "goal" && (
              <form onSubmit={handleAddGoal} className="mb-3 p-2.5 rounded bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                <input 
                  type="text" 
                  placeholder="Goal Name (e.g. Child Education)" 
                  value={goalName} 
                  onChange={e => setGoalName(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100" 
                  required 
                />
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Target (₹)" 
                    value={goalAmount} 
                    onChange={e => setGoalAmount(e.target.value)} 
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100 font-mono" 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Years" 
                    value={goalYears} 
                    onChange={e => setGoalYears(e.target.value)} 
                    className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-100" 
                    required 
                  />
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button type="button" onClick={() => setActiveModal(null)} className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">Cancel</button>
                  <button type="submit" className="px-2 py-1 rounded bg-blue-600 text-white">Save</button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {profile.goals.map(g => (
                <div key={g.id} className="flex justify-between items-center group p-2 rounded bg-zinc-950/40 border border-zinc-800/40 text-xs">
                  <div>
                    <p className="font-medium text-zinc-200">{g.name}</p>
                    <p className="text-[10px] text-zinc-500">Target: {g.target_years} Yrs • {g.priority || 'Essential'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-blue-400 font-mono font-medium">{formatCurrency(g.target_amount)}</p>
                    <button 
                      onClick={() => handleDeleteGoal(g.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
