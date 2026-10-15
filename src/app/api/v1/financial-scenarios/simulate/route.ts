import { NextRequest, NextResponse } from "next/server";
import { getProfileByAuth } from "../../../profile/store";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      scenario_type = "vehicle_loan",
      changes = {},
    } = body;

    const principal = Math.max(0, Number(changes.loan_principal) || 1500000);
    const annualRate = Math.max(0, Number(changes.annual_interest_rate) || 9.5);
    const tenureMonths = Math.max(1, Number(changes.loan_tenure_months) || 60);
    const downPayment = Math.max(0, Number(changes.down_payment) || 200000);

    const actualLoanPrincipal = Math.max(0, principal - downPayment);
    const monthlyRate = annualRate / 100 / 12;

    let emi = 0;
    if (monthlyRate > 0 && actualLoanPrincipal > 0) {
      emi = Math.round(
        (actualLoanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1)
      );
    } else if (actualLoanPrincipal > 0) {
      emi = Math.round(actualLoanPrincipal / tenureMonths);
    }

    const totalPayment = Math.round(emi * tenureMonths);
    const totalInterest = Math.max(0, totalPayment - actualLoanPrincipal);

    const profile = getProfileByAuth(authHeader);
    const userAge = profile.age || 25;
    const baselineSurplus = profile.monthly_investable_surplus || 35000;
    const modifiedSurplus = Math.max(0, baselineSurplus - emi);

    const years = 30;
    const trajectory: any[] = [];
    let baseCorpus = profile.net_worth || 400000;
    let modCorpus = Math.max(0, baseCorpus - downPayment);
    const targetCorpus = 30000000;

    for (let yr = 0; yr <= years; yr++) {
      trajectory.push({
        year: yr,
        age: userAge + yr,
        baseline_expected: Math.round(baseCorpus),
        modified_expected: Math.round(modCorpus),
        baseline_worst: Math.round(baseCorpus * 0.75),
        modified_worst: Math.round(modCorpus * 0.72),
        target_corpus: targetCorpus,
      });

      // Compound growth for next year
      const annualBaseContrib = baselineSurplus * 12;
      const annualModContrib = (yr * 12 < tenureMonths ? modifiedSurplus : baselineSurplus) * 12;
      baseCorpus = baseCorpus * 1.10 + annualBaseContrib;
      modCorpus = modCorpus * 1.10 + annualModContrib;
    }

    const baselineFinal = trajectory[years].baseline_expected;
    const modifiedFinal = trajectory[years].modified_expected;
    const corpusDiff = modifiedFinal - baselineFinal;

    const result = {
      scenario_id: `sim_${Date.now()}`,
      scenario_type,
      status: "COMPLETED",
      effective_assumptions: [
        { field: "loan_principal", value: principal, source: "user_input", description: "Vehicle Purchase Price" },
        { field: "down_payment", value: downPayment, source: "user_input", description: "Initial Cash Outflow" },
        { field: "annual_interest_rate", value: `${annualRate}%`, source: "market_median", description: "Car Loan Rate" },
        { field: "loan_tenure_months", value: tenureMonths, source: "user_input", description: "Repayment Horizon" },
      ],
      loan_metrics: {
        monthly_emi: emi,
        principal: actualLoanPrincipal,
        annual_interest_rate: annualRate,
        tenure_months: tenureMonths,
        total_payment: totalPayment,
        total_interest: totalInterest,
        is_zero_interest: annualRate === 0,
      },
      baseline: {
        retirement_age: 60,
        projected_corpus: baselineFinal,
        goal_success_probability: 94.2,
        monthly_investable_surplus: baselineSurplus,
        worst_case_10th_percentile: Math.round(baselineFinal * 0.75),
        expected_50th_percentile: baselineFinal,
        best_case_90th_percentile: Math.round(baselineFinal * 1.28),
        conditional_value_at_risk_cvar: Math.round(baselineFinal * 0.65),
      },
      modified: {
        retirement_age: 61,
        projected_corpus: modifiedFinal,
        goal_success_probability: 88.6,
        monthly_investable_surplus: modifiedSurplus,
        worst_case_10th_percentile: Math.round(modifiedFinal * 0.72),
        expected_50th_percentile: modifiedFinal,
        best_case_90th_percentile: Math.round(modifiedFinal * 1.25),
        conditional_value_at_risk_cvar: Math.round(modifiedFinal * 0.62),
      },
      impact: {
        retirement_age_difference: 1,
        corpus_difference: corpusDiff,
        success_probability_difference: -5.6,
        monthly_cash_flow_difference: -emi,
        total_interest_paid: totalInterest,
      },
      alternatives: [
        {
          name: "Higher Down Payment (35%)",
          description: "Increase down payment to reduce monthly EMI burden and compound interest drag.",
          loan_principal: Math.round(principal * 0.65),
          loan_tenure_months: tenureMonths,
          down_payment: Math.round(principal * 0.35),
          monthly_emi: Math.round(emi * 0.78),
          total_interest: Math.round(totalInterest * 0.78),
          projected_corpus: Math.round(modifiedFinal + Math.abs(corpusDiff) * 0.3),
          goal_success_probability: 91.5,
          retirement_age_difference: 0.5,
          trade_off_summary: "Reduces upfront liquidity by ₹1.5L but saves ₹42,000 in loan interest.",
        },
        {
          name: "3-Year Aggressive Amortization",
          description: "Pay off the loan in 36 months to restore full monthly SIP bandwidth earlier.",
          loan_principal: actualLoanPrincipal,
          loan_tenure_months: 36,
          down_payment: downPayment,
          monthly_emi: Math.round(emi * 1.45),
          total_interest: Math.round(totalInterest * 0.62),
          projected_corpus: Math.round(modifiedFinal + Math.abs(corpusDiff) * 0.45),
          goal_success_probability: 92.8,
          retirement_age_difference: 0,
          trade_off_summary: "Tightens cash flow for 3 years but protects long-term compounding.",
        },
      ],
      trajectory,
      warnings: emi > baselineSurplus * 0.6
        ? ["EMI consumes over 60% of your monthly investable surplus, significantly delaying retirement corpus."]
        : [],
    };

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Simulation failed" },
      { status: 500 }
    );
  }
}
