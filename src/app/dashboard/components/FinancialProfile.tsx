"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Wallet, CreditCard, Target, RefreshCw } from "lucide-react";

interface Profile {
  name: string;
  email: string;
  age: number;
  base_salary: number;
  assets: { id: number; name: string; current_value: number; asset_type: string }[];
  liabilities: { id: number; name: string; principal_remaining: number; interest_rate: number }[];
  goals: { id: number; name: string; target_amount: number; target_years: number }[];
}

import InteractiveCat from "../../components/InteractiveCat";

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      onRetry();
      setIsRetrying(false);
    }, 600); // Small visual delay so the user sees the spin
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
    motionValue.set(value);
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
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
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
          {/* Identity Card */}
          <motion.div variants={item} className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-zinc-100">{profile.name}</h2>
                <p className="text-xs text-zinc-500">{profile.email} • Age {profile.age}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 mb-0.5">Base Salary</p>
                <p className="text-sm font-medium text-zinc-300"><AnimatedCounter value={profile.base_salary} /></p>
              </div>
            </div>
          </motion.div>

          {/* Assets */}
          <motion.div variants={item} className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/30 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-emerald-400">
                <Wallet className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Assets</h3>
              </div>
              <span className="text-sm font-medium text-zinc-300"><AnimatedCounter value={totalAssets} /></span>
            </div>
            <div className="space-y-3">
              {profile.assets.map(a => (
                <motion.div key={a.id} whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }} className="flex justify-between items-center group p-1.5 -mx-1.5 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{a.name}</p>
                    <p className="text-xs text-zinc-600 capitalize">{a.asset_type}</p>
                  </div>
                  <p className="text-sm text-zinc-400 font-mono">{formatCurrency(a.current_value)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Liabilities */}
          <motion.div variants={item} className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-rose-400">
                <CreditCard className="w-4 h-4 mr-2" />
                <h3 className="text-sm font-medium">Liabilities</h3>
              </div>
              <span className="text-sm font-medium text-zinc-300"><AnimatedCounter value={totalLiabilities} /></span>
            </div>
            <div className="space-y-3">
              {profile.liabilities.map(l => (
                <motion.div key={l.id} whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }} className="flex justify-between items-center group p-1.5 -mx-1.5 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{l.name}</p>
                    <p className="text-xs text-zinc-600">{l.interest_rate * 100}% APR</p>
                  </div>
                  <p className="text-sm text-zinc-400 font-mono">{formatCurrency(l.principal_remaining)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Goals */}
          <motion.div variants={item} className="p-5 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <div className="flex items-center text-blue-400 mb-4">
              <Target className="w-4 h-4 mr-2" />
              <h3 className="text-sm font-medium">Active Goals</h3>
            </div>
            <div className="space-y-3">
              {profile.goals.map(g => (
                <motion.div key={g.id} whileHover={{ scale: 1.01 }} className="flex justify-between items-center p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{g.name}</p>
                    <p className="text-xs text-zinc-500">Target: {g.target_years} Yrs</p>
                  </div>
                  <p className="text-sm text-blue-400 font-medium font-mono">{formatCurrency(g.target_amount)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}
