import { NextRequest, NextResponse } from "next/server";
import { getProfileByAuth } from "../../profile/store";

interface LoanSim {
  id?: number;
  name: string;
  principal: number;
  annualRate: number;
  monthlyPayment: number;
}

interface Milestone {
  liability_id?: number;
  liability_name: string;
  payoff_month: number;
  principal_paid: number;
  interest_paid: number;
}

interface StrategyResult {
  strategy_name: string;
  description: string;
  months_to_debt_free: number;
  total_interest_paid: number;
  total_principal_paid: number;
  total_amount_paid: number;
  interest_saved_vs_baseline: number;
  months_saved_vs_baseline: number;
  loan_milestones: Milestone[];
}

function simulateStrategy(
  loans: LoanSim[],
  strategyName: string,
  extraPrepayment: number,
  lumpSum: number,
  baselineInterest?: number,
  baselineMonths?: number
): StrategyResult {
  if (loans.length === 0) {
    return {
      strategy_name: strategyName,
      description: "No active liabilities.",
      months_to_debt_free: 0,
      total_interest_paid: 0,
      total_principal_paid: 0,
      total_amount_paid: 0,
      interest_saved_vs_baseline: 0,
      months_saved_vs_baseline: 0,
      loan_milestones: [],
    };
  }

  // Clone loans
  const active = loans.map((l) => ({
    id: l.id,
    name: l.name,
    balance: l.principal,
    annualRate: l.annualRate,
    monthlyPayment: l.monthlyPayment,
    interestPaid: 0,
    paidOffMonth: 0,
  }));

  const totalInitialPrincipal = active.reduce((sum, l) => sum + l.balance, 0);

  // Apply lump sum prepayment in month 1
  let remainingLumpSum = lumpSum;
  if (remainingLumpSum > 0) {
    if (strategyName === "Debt Avalanche") {
      active.sort((a, b) => b.annualRate - a.annualRate);
    } else if (strategyName === "Debt Snowball") {
      active.sort((a, b) => a.balance - b.balance);
    }
    for (const l of active) {
      if (remainingLumpSum <= 0) break;
      const take = Math.min(l.balance, remainingLumpSum);
      l.balance -= take;
      remainingLumpSum -= take;
    }
  }

  let month = 0;
  const maxMonths = 360;
  const milestones: Milestone[] = [];
  let totalInterestAccum = 0;

  while (active.some((l) => l.balance > 0.01) && month < maxMonths) {
    month++;
    let poolForExtra = extraPrepayment;

    // 1. Accrue monthly interest and pay minimum EMIs
    for (const l of active) {
      if (l.balance <= 0.01) continue;
      const monthlyRate = l.annualRate / 12;
      const interest = l.balance * monthlyRate;
      l.interestPaid += interest;
      totalInterestAccum += interest;
      l.balance += interest;

      const emi = Math.min(l.balance, l.monthlyPayment);
      l.balance -= emi;

      // If loan paid off, its contractual EMI rolls into the extra pool
      if (l.balance <= 0.01 && l.paidOffMonth === 0) {
        l.paidOffMonth = month;
        milestones.push({
          liability_id: l.id,
          liability_name: l.name,
          payoff_month: month,
          principal_paid: Math.round(l.balance + emi),
          interest_paid: Math.round(l.interestPaid),
        });
        poolForExtra += l.monthlyPayment;
      }
    }

    // 2. Apply extra prepayment to target loan
    if (poolForExtra > 0 && strategyName !== "Baseline") {
      const openLoans = active.filter((l) => l.balance > 0.01);
      if (openLoans.length > 0) {
        if (strategyName === "Debt Avalanche") {
          openLoans.sort((a, b) => b.annualRate - a.annualRate);
        } else if (strategyName === "Debt Snowball") {
          openLoans.sort((a, b) => a.balance - b.balance);
        }

        let extraToSpend = poolForExtra;
        for (const target of openLoans) {
          if (extraToSpend <= 0) break;
          const prepayment = Math.min(target.balance, extraToSpend);
          target.balance -= prepayment;
          extraToSpend -= prepayment;

          if (target.balance <= 0.01 && target.paidOffMonth === 0) {
            target.paidOffMonth = month;
            milestones.push({
              liability_id: target.id,
              liability_name: target.name,
              payoff_month: month,
              principal_paid: Math.round(target.balance + prepayment),
              interest_paid: Math.round(target.interestPaid),
            });
          }
        }
      }
    }
  }

  const totInterest = Math.round(totalInterestAccum);
  const interestSaved = baselineInterest !== undefined ? Math.max(0, baselineInterest - totInterest) : 0;
  const monthsSaved = baselineMonths !== undefined ? Math.max(0, baselineMonths - month) : 0;

  const descMap: Record<string, string> = {
    Baseline: "Standard contractual minimum EMIs with zero prepayment acceleration.",
    "Debt Avalanche": "Aggressively targets the loan with the highest interest rate first to minimize total interest friction.",
    "Debt Snowball": "Aggressively eliminates the loan with the smallest balance first for rapid psychological wins.",
  };

  return {
    strategy_name: strategyName,
    description: descMap[strategyName] || "",
    months_to_debt_free: month,
    total_interest_paid: totInterest,
    total_principal_paid: Math.round(totalInitialPrincipal),
    total_amount_paid: Math.round(totalInitialPrincipal + totInterest),
    interest_saved_vs_baseline: interestSaved,
    months_saved_vs_baseline: monthsSaved,
    loan_milestones: milestones,
  };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { extra_monthly_prepayment = 5000, lump_sum_prepayment = 0 } = body;

    const profile = getProfileByAuth(authHeader);
    const parsedLoans: LoanSim[] = profile.liabilities
      .filter((l) => (Number(l.principal_remaining) || 0) > 0)
      .map((l) => ({
        id: l.id,
        name: l.name,
        principal: Number(l.principal_remaining) || 0,
        annualRate: (() => {
          const r = Number(l.interest_rate) || 0.09;
          return r > 1 ? r / 100 : r;
        })(),
        monthlyPayment: Number(l.monthly_payment) || (Number(l.principal_remaining) * 0.02),
      }));

    const totalInitialDebt = parsedLoans.reduce((sum, l) => sum + l.principal, 0);

    const baseline = simulateStrategy(parsedLoans, "Baseline", 0, 0);
    const avalanche = simulateStrategy(
      parsedLoans,
      "Debt Avalanche",
      extra_monthly_prepayment,
      lump_sum_prepayment,
      baseline.total_interest_paid,
      baseline.months_to_debt_free
    );
    const snowball = simulateStrategy(
      parsedLoans,
      "Debt Snowball",
      extra_monthly_prepayment,
      lump_sum_prepayment,
      baseline.total_interest_paid,
      baseline.months_to_debt_free
    );

    const savingsDiff = Math.max(0, snowball.total_interest_paid - avalanche.total_interest_paid);
    const recommended = savingsDiff > 5000 ? "Debt Avalanche" : "Debt Snowball";

    const takeaways: string[] = [
      `Prepaying ₹${extra_monthly_prepayment.toLocaleString('en-IN')}/mo frees you from debt ${avalanche.months_saved_vs_baseline} months earlier under Avalanche.`,
      `Total interest savings with Avalanche: ₹${avalanche.interest_saved_vs_baseline.toLocaleString('en-IN')}.`,
      savingsDiff > 0
        ? `Avalanche beats Snowball by ₹${savingsDiff.toLocaleString('en-IN')} in pure interest saved.`
        : `Snowball offers identical interest savings with faster initial loan payoff closures.`,
    ];

    return NextResponse.json({
      total_initial_debt: Math.round(totalInitialDebt),
      extra_monthly_prepayment,
      lump_sum_prepayment,
      recommended_strategy: recommended,
      financial_savings_diff_avalanche_vs_snowball: Math.round(savingsDiff),
      baseline,
      avalanche,
      snowball,
      actionable_takeaways: takeaways,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Debt optimization calculation failed" },
      { status: 500 }
    );
  }
}
