"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface ModeScore {
  id: string;
  name: string;
  href: string;
  tabKey?: string;
  category: "wealth" | "debt" | "safety" | "tax" | "decision";
  matchScore: number; // 0 - 100
  urgencyLevel: "critical" | "warning" | "opportunity" | "optimal";
  headline: string;
  reason: string;
  keyMetric: string;
  actionLabel: string;
  tags: string[];
}

export interface ModeIntelligenceContextType {
  recommendedMode: ModeScore;
  allModes: ModeScore[];
  isRadarOpen: boolean;
  setIsRadarOpen: (open: boolean) => void;
  isAutopilotActive: boolean;
  toggleAutopilot: () => void;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  refreshIntelligence: () => Promise<void>;
  profileSummary: {
    name: string;
    surplus: number;
    runway: number;
    dti: number;
    debt: number;
    healthScore: number;
  };
}

const defaultRecommendedMode: ModeScore = {
  id: "goals",
  name: "Goal Chaser",
  href: "/dashboard/goals",
  category: "wealth",
  matchScore: 92,
  urgencyLevel: "opportunity",
  headline: "High Compounding Leverage Identified",
  reason: "ChronoFi detected active financial goals with surplus cash flow ready for automated SIP milestone compounding.",
  keyMetric: "+₹33,000/mo Surplus",
  actionLabel: "Launch Goal Chaser",
  tags: ["SIP Compounding", "Milestone Solver", "Inflation Adjusted"],
};

const ModeIntelligenceContext = createContext<ModeIntelligenceContextType | null>(null);

export function ModeIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<any>(null);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;

      const res = await fetch("/api/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile, pathname]);

  // Compute all modes dynamically based on live balance sheet
  const modeAnalysis = useMemo(() => {
    if (!profile) {
      return {
        recommended: defaultRecommendedMode,
        all: [defaultRecommendedMode],
        summary: { name: "User", surplus: 33000, runway: 4.3, dti: 15, debt: 300000, healthScore: 75 },
      };
    }

    const salary = Number(profile.base_salary) || 80000;
    const expenses = Number(profile.monthly_expenses) || 35000;
    const surplus = Number(profile.monthly_investable_surplus) || 33000;
    const runway = Number(profile.months_of_runway) || 4.3;
    const liabilities = profile.liabilities || [];
    const totalDebt = liabilities.reduce((sum: number, l: any) => sum + (Number(l.principal_remaining) || 0), 0);
    const monthlyDebt = liabilities.reduce((sum: number, l: any) => sum + (Number(l.monthly_payment) || 0), 0);
    const dti = salary > 0 ? Number(((monthlyDebt / salary) * 100).toFixed(1)) : 0;
    const goals = profile.goals || [];
    const annualSalary = salary * 12;

    const modes: ModeScore[] = [];

    // 1. Evaluate Liquidity Shock Stress Tester
    let stressScore = 40;
    let stressUrgency: ModeScore["urgencyLevel"] = "optimal";
    let stressHeadline = "Liquidity Buffer Stable";
    let stressReason = `Emergency runway is ${runway} months, sufficient for standard shocks.`;

    if (runway < 2.0) {
      stressScore = 98;
      stressUrgency = "critical";
      stressHeadline = "Critical Runway Deficit Detected";
      stressReason = `Liquid cash reserves cover only ${runway} months of living costs (₹${expenses.toLocaleString('en-IN')}/mo). Immediate stress simulation needed to model survival under income shocks.`;
    } else if (runway < 4.0) {
      stressScore = 84;
      stressUrgency = "warning";
      stressHeadline = "Runway Below 6-Month Safety Standard";
      stressReason = `Current runway of ${runway} months leaves you vulnerable to sudden medical or unemployment disruptions. Test your 4-tier liquidation waterfall.`;
    } else if (runway >= 6.0) {
      stressScore = 55;
      stressUrgency = "optimal";
      stressHeadline = "Resilient Liquidity Buffer (Robust)";
      stressReason = `Your ${runway} months of emergency runway comfortably exceeds standard safety thresholds.`;
    }

    modes.push({
      id: "stress",
      name: "Liquidity Stress Tester",
      href: "/dashboard/simulations?tab=stress",
      tabKey: "stress",
      category: "safety",
      matchScore: stressScore,
      urgencyLevel: stressUrgency,
      headline: stressHeadline,
      reason: stressReason,
      keyMetric: `${runway} Mos Runway`,
      actionLabel: "Run Stress Test",
      tags: ["4-Tier Waterfall", "Job Loss Shock", "Insolvency Risk"],
    });

    // 2. Evaluate Debt Payoff Optimizer
    let debtScore = 30;
    let debtUrgency: ModeScore["urgencyLevel"] = "optimal";
    let debtHeadline = "Zero Active Liabilities";
    let debtReason = "No active loans detected on your balance sheet.";

    if (totalDebt > 0) {
      const highestRate = Math.max(...liabilities.map((l: any) => {
        const r = Number(l.interest_rate) || 0.09;
        return (r > 1 ? r / 100 : r) * 100;
      }));
      if (dti > 30) {
        debtScore = 94;
        debtUrgency = "critical";
        debtHeadline = `Heavy Debt Friction: DTI at ${dti}%`;
        debtReason = `Contractual EMIs (₹${monthlyDebt.toLocaleString('en-IN')}/mo) consume ${dti}% of gross salary. Debt Avalanche can eliminate ₹${totalDebt.toLocaleString('en-IN')} in principal significantly faster.`;
      } else if (highestRate >= 8.0) {
        debtScore = 86;
        debtUrgency = "warning";
        debtHeadline = `Interest Drag on ₹${totalDebt.toLocaleString('en-IN')} Debt`;
        debtReason = `You are carrying ₹${totalDebt.toLocaleString('en-IN')} in debt with rates up to ${highestRate.toFixed(1)}%. Accelerating prepayment via Avalanche saves considerable compound interest.`;
      } else {
        debtScore = 65;
        debtUrgency = "opportunity";
        debtHeadline = `Manageable Debt: DTI ${dti}%`;
        debtReason = `Debt obligations are within healthy limits, but prepayment optimization can free up monthly cash flow earlier.`;
      }
    }

    modes.push({
      id: "debt",
      name: "Debt Payoff Optimizer",
      href: "/dashboard/simulations?tab=debt",
      tabKey: "debt",
      category: "debt",
      matchScore: debtScore,
      urgencyLevel: debtUrgency,
      headline: debtHeadline,
      reason: debtReason,
      keyMetric: totalDebt > 0 ? `₹${totalDebt.toLocaleString('en-IN')} Debt` : "Debt-Free",
      actionLabel: "Optimize Debt Payoff",
      tags: ["Avalanche vs Snowball", "Interest Prepayment", "EMI Acceleration"],
    });

    // 3. Evaluate Tax Planner
    let taxScore = 45;
    let taxUrgency: ModeScore["urgencyLevel"] = "optimal";
    let taxHeadline = "Standard Tax Bracket";
    let taxReason = "Your current income level benefits from Section 87A rebate thresholds.";

    if (annualSalary >= 2400000) {
      taxScore = 95;
      taxUrgency = "opportunity";
      taxHeadline = "High-Tax Bracket Drag Identified";
      taxReason = `Gross income of ₹${(annualSalary / 100000).toFixed(1)}L/yr falls into top 30% slabs. Finance Act 2024 LTCG rules (12.5% over ₹1.25L exemption) offer major tax savings when planning goal drawdowns.`;
    } else if (annualSalary >= 1200000) {
      taxScore = 83;
      taxUrgency = "opportunity";
      taxHeadline = "Tax Regime Arbitrage & Drawdown";
      taxReason = `Evaluate New vs Old Regime savings and plan capital gains tax drag on your investment portfolio to prevent post-tax goal shortfalls.`;
    }

    modes.push({
      id: "tax",
      name: "Tax Planner & Drawdown",
      href: "/dashboard/tax",
      category: "tax",
      matchScore: taxScore,
      urgencyLevel: taxUrgency,
      headline: taxHeadline,
      reason: taxReason,
      keyMetric: `₹${(annualSalary / 100000).toFixed(1)}L Annual`,
      actionLabel: "Analyze Tax Drag",
      tags: ["Finance Act 2024", "LTCG Exemption", "New vs Old Regime"],
    });

    // 4. Evaluate Goal Chaser
    let goalScore = 50;
    let goalUrgency: ModeScore["urgencyLevel"] = "optimal";
    let goalHeadline = "Goal Portfolio Inactive";
    let goalReason = "Configure your target milestones to calculate required SIP investments.";

    if (goals.length > 0 && surplus >= 15000 && runway >= 3.5) {
      goalScore = 93;
      goalUrgency = "opportunity";
      goalHeadline = `High Compounding Surplus: ₹${surplus.toLocaleString('en-IN')}/mo`;
      goalReason = `You have ₹${surplus.toLocaleString('en-IN')}/mo in unallocated investable surplus and ${goals.length} active targets (${goals.map((g: any) => g.name).slice(0, 2).join(", ")}). Goal Chaser calculates the exact inflation-adjusted SIP needed.`;
    } else if (goals.length > 0) {
      goalScore = 78;
      goalUrgency = "opportunity";
      goalHeadline = `${goals.length} Active Financial Milestones`;
      goalReason = `Calibrate your automated SIP and milestone timelines for ${goals.length} configured targets.`;
    }

    modes.push({
      id: "goals",
      name: "Goal Chaser",
      href: "/dashboard/goals",
      category: "wealth",
      matchScore: goalScore,
      urgencyLevel: goalUrgency,
      headline: goalHeadline,
      reason: goalReason,
      keyMetric: `₹${surplus.toLocaleString('en-IN')}/mo Surplus`,
      actionLabel: "Launch Goal Chaser",
      tags: ["Automated SIP", "Inflation Modeling", "Milestone Solver"],
    });

    // 5. Evaluate What-If Simulator
    const simScore = totalDebt > 0 || goals.length > 1 ? 79 : 60;
    modes.push({
      id: "simulator",
      name: "What-If Simulator",
      href: "/dashboard/simulations?tab=scenario",
      tabKey: "scenario",
      category: "decision",
      matchScore: simScore,
      urgencyLevel: "opportunity",
      headline: "Monte Carlo Decision Testing",
      reason: "Simulate major life purchases, vehicle loans, or salary shifts to test the probability of maintaining your retirement age.",
      keyMetric: "1,000 Path Monte Carlo",
      actionLabel: "Simulate What-If",
      tags: ["CRN Variance Reduction", "Retirement Trade-off", "Decision Sandbox"],
    });

    // 6. Evaluate Financial Health Monitor
    const healthScore = profile.net_worth ? 74 : 60;
    modes.push({
      id: "health",
      name: "Financial Health Monitor",
      href: "/dashboard/simulations?tab=health",
      tabKey: "health",
      category: "safety",
      matchScore: runway < 3 || dti > 35 ? 88 : 70,
      urgencyLevel: runway < 3 || dti > 35 ? "warning" : "optimal",
      headline: "4-Factor Balance Sheet Score",
      reason: "Examine composite scoring across Emergency Runway, Debt-to-Income, Savings Rate, and Goal Progress.",
      keyMetric: `${healthScore}/100 Health Score`,
      actionLabel: "View Diagnostic",
      tags: ["Composite Score", "Variance Tracking", "Milestone Check"],
    });

    // Sort by matchScore descending
    const sorted = [...modes].sort((a, b) => b.matchScore - a.matchScore);
    const topRecommended = sorted[0] || defaultRecommendedMode;

    return {
      recommended: topRecommended,
      all: sorted,
      summary: {
        name: profile.name || "User",
        surplus,
        runway,
        dti,
        debt: totalDebt,
        healthScore,
      },
    };
  }, [profile]);

  const toggleAutopilot = () => setIsAutopilotActive((prev) => !prev);
  const dismissBanner = () => setIsBannerDismissed(true);

  return (
    <ModeIntelligenceContext.Provider
      value={{
        recommendedMode: modeAnalysis.recommended,
        allModes: modeAnalysis.all,
        isRadarOpen,
        setIsRadarOpen,
        isAutopilotActive,
        toggleAutopilot,
        isBannerDismissed,
        dismissBanner,
        refreshIntelligence: fetchProfile,
        profileSummary: modeAnalysis.summary,
      }}
    >
      {children}
    </ModeIntelligenceContext.Provider>
  );
}

export function useModeIntelligence() {
  const context = useContext(ModeIntelligenceContext);
  if (!context) {
    throw new Error("useModeIntelligence must be used within a ModeIntelligenceProvider");
  }
  return context;
}
