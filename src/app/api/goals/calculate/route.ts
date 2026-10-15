import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      target_amount = 1000000,
      years = 3,
      current_savings = 50000,
      expected_return_rate = 11, // percentage
      inflation_rate = 6, // percentage
      apply_inflation = true,
      monthly_savings_capacity = 35000,
    } = body;

    const r = Math.max(0.01, expected_return_rate / 100);
    const inf = apply_inflation ? Math.max(0, inflation_rate / 100) : 0;
    const n = Math.max(0.5, years);
    const m = Math.round(n * 12);
    const monthlyRate = r / 12;

    // 1. Inflation Adjusted Target
    const adjustedTarget = Math.round(target_amount * Math.pow(1 + inf, n));

    // 2. Future Value of Existing Seed Corpus
    const fvExisting = Math.round(current_savings * Math.pow(1 + r, n));

    // 3. Net Deficit to fund via SIP
    const netDeficit = Math.max(0, adjustedTarget - fvExisting);

    // 4. Standard Monthly SIP
    let monthlySip = 0;
    if (netDeficit > 0 && monthlyRate > 0) {
      const annuityFactor = (1 + monthlyRate) * (Math.pow(1 + monthlyRate, m) - 1) / monthlyRate;
      monthlySip = Math.round(netDeficit / annuityFactor);
    }

    // 5. Step-Up SIP (10% annual increment)
    const annualGrowth = 0.10;
    let stepUpStartingSip = monthlySip;
    if (netDeficit > 0 && n >= 1) {
      let stepUpFactor = 0;
      const fullYears = Math.floor(n);
      const oneYearAnnuity = (1 + monthlyRate) * (Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate;

      for (let y = 0; y < fullYears; y++) {
        const yearGrowth = Math.pow(1 + annualGrowth, y);
        const compoundToTarget = Math.pow(1 + r, fullYears - 1 - y);
        stepUpFactor += yearGrowth * oneYearAnnuity * compoundToTarget;
      }
      if (stepUpFactor > 0) {
        stepUpStartingSip = Math.round(netDeficit / stepUpFactor);
      }
    }

    // 6. Total Capital Outlay & Wealth Gain
    const totalSipInvested = monthlySip * m;
    const totalOutlay = current_savings + totalSipInvested;
    const wealthGain = Math.max(0, adjustedTarget - totalOutlay);

    // 7. Feasibility Score
    const capacity = Math.max(1000, monthly_savings_capacity);
    const burdenRatio = monthlySip / capacity;
    let feasibilityScore = 95;
    let feasibilityStatus: "Highly Feasible" | "Moderate Target" | "Challenging Horizon" = "Highly Feasible";

    if (burdenRatio <= 0.6) {
      feasibilityScore = Math.min(99, Math.round(98 - burdenRatio * 15));
      feasibilityStatus = "Highly Feasible";
    } else if (burdenRatio <= 1.0) {
      feasibilityScore = Math.round(85 - (burdenRatio - 0.6) * 40);
      feasibilityStatus = "Moderate Target";
    } else {
      feasibilityScore = Math.max(25, Math.round(65 - (burdenRatio - 1.0) * 35));
      feasibilityStatus = "Challenging Horizon";
    }

    // 8. Asset Allocation Recommendation based on timeline
    let allocation = { equity: 50, debt: 40, gold: 10 };
    if (n < 3) {
      allocation = { equity: 15, debt: 75, gold: 10 };
    } else if (n <= 7) {
      allocation = { equity: 55, debt: 35, gold: 10 };
    } else {
      allocation = { equity: 75, debt: 20, gold: 5 };
    }

    // 9. Milestone trajectory checkpoints
    const milestonePercents = [0.25, 0.50, 0.75, 1.00];
    const milestones = milestonePercents.map((pct) => {
      const milestoneAmount = Math.round(adjustedTarget * pct);
      const estYear = +(n * Math.sqrt(pct)).toFixed(1);
      return {
        percent: pct * 100,
        label: `${pct * 100}% Milestone`,
        year: estYear,
        projectedAmount: milestoneAmount,
      };
    });

    return NextResponse.json({
      target_amount,
      adjusted_target: adjustedTarget,
      timeline_years: n,
      current_savings,
      fv_existing: fvExisting,
      net_deficit: netDeficit,
      monthly_sip: monthlySip,
      step_up_starting_sip: stepUpStartingSip,
      total_outlay: totalOutlay,
      wealth_gain: wealthGain,
      feasibility_score: feasibilityScore,
      feasibility_status: feasibilityStatus,
      allocation,
      milestones,
    });
  } catch (err: unknown) {
    return NextResponse.json({ detail: (err as Error).message || "Calculation failed" }, { status: 400 });
  }
}
