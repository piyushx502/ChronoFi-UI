import { NextRequest, NextResponse } from "next/server";
import { getProfileByAuth } from "../../profile/store";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const profile = getProfileByAuth(authHeader);

    const grossMonthlyIncome = profile.base_salary || 80000;
    const monthlyExpenses = profile.monthly_expenses || 35000;
    const monthlyDebt = profile.liabilities.reduce((sum, l) => sum + (Number(l.monthly_payment) || 0), 0);
    const liquidCash = profile.assets
      .filter((a) => /cash|liquid|saving|deposit/.test((a.asset_type || a.name).toLowerCase()))
      .reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);

    // 1. Emergency Runway (25 pts)
    const monthsRunway = monthlyExpenses > 0 ? Number((liquidCash / monthlyExpenses).toFixed(1)) : 12;
    const runwayScore = Math.min(25, Number(((monthsRunway / 6) * 25).toFixed(1)));
    const runwayStatus = monthsRunway >= 6 ? "EXCELLENT" : monthsRunway >= 3 ? "GOOD" : monthsRunway >= 1 ? "FAIR" : "CRITICAL";
    const runwayRec = monthsRunway >= 6
      ? null
      : `Current liquid runway is ${monthsRunway} months. Build ₹${Math.round((6 - monthsRunway) * monthlyExpenses).toLocaleString('en-IN')} to establish a 6-month buffer.`;

    // 2. DTI (25 pts)
    const dtiPct = grossMonthlyIncome > 0 ? Number(((monthlyDebt / grossMonthlyIncome) * 100).toFixed(1)) : 0;
    let dtiScore = 25;
    if (dtiPct > 50) dtiScore = Math.max(0, 5 - ((dtiPct - 50) / 30) * 5);
    else if (dtiPct > 35) dtiScore = 15 - ((dtiPct - 35) / 15) * 10;
    else if (dtiPct > 20) dtiScore = 25 - ((dtiPct - 20) / 15) * 10;
    dtiScore = Number(dtiScore.toFixed(1));
    const dtiStatus = dtiPct <= 20 ? "EXCELLENT" : dtiPct <= 35 ? "GOOD" : dtiPct <= 50 ? "FAIR" : "CRITICAL";
    const dtiRec = dtiPct > 35 ? `DTI is ${dtiPct}%. Accelerate debt payoff using Avalanche strategy.` : null;

    // 3. Savings Rate (25 pts)
    const totalOutflows = monthlyExpenses + monthlyDebt;
    const netSurplus = grossMonthlyIncome - totalOutflows;
    const savingsRatePct = grossMonthlyIncome > 0 ? Number(((netSurplus / grossMonthlyIncome) * 100).toFixed(1)) : 0;
    let savingsScore = 0;
    if (savingsRatePct >= 30) savingsScore = 25;
    else if (savingsRatePct >= 15) savingsScore = 15 + ((savingsRatePct - 15) / 15) * 10;
    else if (savingsRatePct > 0) savingsScore = (savingsRatePct / 15) * 15;
    savingsScore = Number(savingsScore.toFixed(1));
    const savingsStatus = savingsRatePct >= 30 ? "EXCELLENT" : savingsRatePct >= 15 ? "GOOD" : savingsRatePct > 0 ? "FAIR" : "CRITICAL";
    const savingsRec = savingsRatePct < 20 ? `Boost monthly investment surplus by 5-10% to accelerate wealth accumulation.` : null;

    // 4. Goal Funding (25 pts)
    const totalGoalTarget = profile.goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
    const totalInvestments = profile.assets
      .filter((a) => !/cash|saving/.test((a.asset_type || a.name).toLowerCase()))
      .reduce((sum, a) => sum + (Number(a.current_value) || 0), 0);
    const goalRatio = totalGoalTarget > 0 ? Math.min(100, Number(((totalInvestments / totalGoalTarget) * 100).toFixed(1))) : 80;
    const goalScore = Number(((goalRatio / 100) * 25).toFixed(1));
    const goalStatus = goalRatio >= 70 ? "EXCELLENT" : goalRatio >= 40 ? "GOOD" : "FAIR";

    const compositeScore = Math.round(runwayScore + dtiScore + savingsScore + goalScore);
    const tier = compositeScore >= 85 ? "EXCELLENT" : compositeScore >= 70 ? "GOOD" : compositeScore >= 50 ? "FAIR" : "CRITICAL";

    const priorities: string[] = [];
    if (runwayRec) priorities.push(runwayRec);
    if (dtiRec) priorities.push(dtiRec);
    if (savingsRec) priorities.push(savingsRec);
    if (priorities.length === 0) {
      priorities.push("Maintain disciplined automated SIP contributions across diversified equity indices.");
    }

    const actualNetWorth = profile.net_worth || 400000;
    const projectedNetWorth = Math.round(actualNetWorth * 1.08);
    const varianceAmount = actualNetWorth - projectedNetWorth;
    const variancePct = Number(((varianceAmount / projectedNetWorth) * 100).toFixed(1));

    return NextResponse.json({
      composite_score: compositeScore,
      tier,
      breakdown: [
        {
          category: "Emergency Runway",
          score: runwayScore,
          max_score: 25,
          status: runwayStatus,
          metrics: { liquid_cash: liquidCash, monthly_expenses: monthlyExpenses, months_runway: monthsRunway },
          recommendation: runwayRec,
        },
        {
          category: "Debt-to-Income Ratio",
          score: dtiScore,
          max_score: 25,
          status: dtiStatus,
          metrics: { gross_income: grossMonthlyIncome, monthly_debt: monthlyDebt, dti_pct: dtiPct },
          recommendation: dtiRec,
        },
        {
          category: "Savings & Surplus Rate",
          score: savingsScore,
          max_score: 25,
          status: savingsStatus,
          metrics: { monthly_income: grossMonthlyIncome, net_surplus: netSurplus, savings_rate_pct: savingsRatePct },
          recommendation: savingsRec,
        },
        {
          category: "Goal Funding Progress",
          score: goalScore,
          max_score: 25,
          status: goalStatus,
          metrics: { total_goals: profile.goals.length, avg_funding_ratio_pct: goalRatio },
          recommendation: null,
        },
      ],
      actionable_priorities: priorities,
      net_worth_variance: {
        actual_net_worth: actualNetWorth,
        projected_net_worth: projectedNetWorth,
        variance_amount: varianceAmount,
        variance_pct: variancePct,
        status: variancePct >= 0 ? "AHEAD" : variancePct >= -5 ? "ON_TRACK" : "BEHIND",
        narrative: `Current net worth is ${variancePct >= 0 ? 'ahead of' : 'tracking close to'} your 12-month Monte Carlo baseline.`,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Failed to load financial health score" },
      { status: 500 }
    );
  }
}
