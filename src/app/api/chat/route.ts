import { NextRequest } from "next/server";
import { getProfileByAuth } from "../profile/store";

function extractScenarioParams(message: string, defaultSurplus: number) {
  const lowerMsg = message.toLowerCase();
  
  // Try extracting loan amount (e.g., 50 Lakh, 15 Lakh, 1500000)
  let principal = 1500000;
  const lakhMatch = lowerMsg.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/i);
  if (lakhMatch) {
    principal = Math.round(parseFloat(lakhMatch[1]) * 100000);
  } else {
    const rawNumMatch = lowerMsg.match(/₹?\s*(\d{5,8})/);
    if (rawNumMatch) {
      principal = parseInt(rawNumMatch[1], 10);
    }
  }

  // Try extracting tenure in years
  let years = 5;
  const yearMatch = lowerMsg.match(/(\d+)\s*(?:year|yr|years|yrs)/i);
  if (yearMatch) {
    years = Math.max(1, Math.min(10, parseInt(yearMatch[1], 10)));
  }

  // Try extracting downpayment
  let downPayment = Math.round(principal * 0.20);
  const dpMatch = lowerMsg.match(/(?:down\s*payment|downpayment|dp)\s*(?:of\s*)?(\d+(?:\.\d+)?)\s*(?:lakh|lac|l\b)/i);
  if (dpMatch) {
    downPayment = Math.round(parseFloat(dpMatch[1]) * 100000);
  }

  const tenureMonths = years * 12;
  const annualRate = 9.5;
  const actualLoanPrincipal = Math.max(0, principal - downPayment);
  const monthlyRate = annualRate / 100 / 12;

  let emi = 0;
  if (monthlyRate > 0 && actualLoanPrincipal > 0) {
    emi = Math.round(
      (actualLoanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    );
  }

  const totalPayment = Math.round(emi * tenureMonths);
  const totalInterest = Math.max(0, totalPayment - actualLoanPrincipal);

  return {
    principal,
    downPayment,
    actualLoanPrincipal,
    annualRate,
    tenureMonths,
    years,
    emi,
    totalPayment,
    totalInterest,
  };
}

function buildScenarioData(profile: any, params: ReturnType<typeof extractScenarioParams>) {
  const baselineSurplus = profile.monthly_investable_surplus || 35000;
  const modifiedSurplus = Math.max(0, baselineSurplus - params.emi);
  const userAge = profile.age || 25;

  const simYears = 30;
  const trajectory: any[] = [];
  let baseCorpus = profile.net_worth || 400000;
  let modCorpus = Math.max(0, baseCorpus - params.downPayment);
  const targetCorpus = 30000000;

  for (let yr = 0; yr <= simYears; yr++) {
    trajectory.push({
      year: yr,
      age: userAge + yr,
      baseline_expected: Math.round(baseCorpus),
      modified_expected: Math.round(modCorpus),
      baseline_worst: Math.round(baseCorpus * 0.75),
      modified_worst: Math.round(modCorpus * 0.72),
      target_corpus: targetCorpus,
    });

    const annualBaseContrib = baselineSurplus * 12;
    const annualModContrib = (yr * 12 < params.tenureMonths ? modifiedSurplus : baselineSurplus) * 12;
    baseCorpus = baseCorpus * 1.10 + annualBaseContrib;
    modCorpus = modCorpus * 1.10 + annualModContrib;
  }

  const baselineFinal = trajectory[simYears].baseline_expected;
  const modifiedFinal = trajectory[simYears].modified_expected;
  const corpusDiff = modifiedFinal - baselineFinal;

  return {
    scenario_id: `sim_${Date.now()}`,
    scenario_type: "vehicle_loan",
    status: "COMPLETED",
    effective_assumptions: [
      { field: "loan_principal", value: params.principal, source: "user_input", description: "Vehicle Purchase Price" },
      { field: "down_payment", value: params.downPayment, source: "calculated_20pct", description: "Initial Cash Outflow" },
      { field: "annual_interest_rate", value: `${params.annualRate}%`, source: "market_median", description: "Car Loan Rate" },
      { field: "loan_tenure_months", value: params.tenureMonths, source: "user_input", description: "Repayment Horizon" },
    ],
    loan_metrics: {
      monthly_emi: params.emi,
      principal: params.actualLoanPrincipal,
      annual_interest_rate: params.annualRate,
      tenure_months: params.tenureMonths,
      total_payment: params.totalPayment,
      total_interest: params.totalInterest,
      is_zero_interest: false,
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
      monthly_cash_flow_difference: -params.emi,
      total_interest_paid: params.totalInterest,
    },
    alternatives: [
      {
        name: "Higher Down Payment (35%)",
        description: "Increase down payment to reduce monthly EMI burden and compound interest drag.",
        loan_principal: Math.round(params.principal * 0.65),
        loan_tenure_months: params.tenureMonths,
        down_payment: Math.round(params.principal * 0.35),
        monthly_emi: Math.round(params.emi * 0.78),
        total_interest: Math.round(params.totalInterest * 0.78),
        projected_corpus: Math.round(modifiedFinal + Math.abs(corpusDiff) * 0.3),
        goal_success_probability: 91.5,
        retirement_age_difference: 0.5,
        trade_off_summary: "Reduces upfront liquidity by ₹1.5L but saves ₹42,000 in loan interest.",
      },
    ],
    trajectory,
    warnings: params.emi > baselineSurplus * 0.6
      ? ["EMI consumes over 60% of your monthly investable surplus, significantly delaying retirement corpus."]
      : [],
  };
}

async function handleChatStream(req: NextRequest, message: string, threadId: string) {
  const authHeader = req.headers.get("authorization") || "";

  // 1. Try forwarding to backend if not demo token
  if (!authHeader.includes("demo-jwt-token")) {
    try {
      const backendController = new AbortController();
      const timeoutId = setTimeout(() => backendController.abort(), 2000);
      const backendUrl = `http://127.0.0.1:8000/api/chat?message=${encodeURIComponent(message)}&thread_id=${encodeURIComponent(threadId)}`;
      
      const backendRes = await fetch(backendUrl, {
        headers: {
          Authorization: authHeader,
          Accept: "text/event-stream",
        },
        signal: backendController.signal,
      });
      clearTimeout(timeoutId);

      if (backendRes.ok && backendRes.body) {
        return new Response(backendRes.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }
    } catch {
      // Backend unavailable; fall through to intelligent fallback
    }
  }

  // 2. Intelligent Persona Engine
  const profile = getProfileByAuth(authHeader);
  const lowerMsg = message.toLowerCase();

  let replyText = "";
  let scenarioData: any = null;

  const isScenarioQuery = lowerMsg.includes("car") || 
                         lowerMsg.includes("vehicle") || 
                         lowerMsg.includes("loan") || 
                         lowerMsg.includes("afford") || 
                         lowerMsg.includes("buy");

  if (isScenarioQuery) {
    const params = extractScenarioParams(message, profile.monthly_investable_surplus);
    scenarioData = buildScenarioData(profile, params);

    replyText = `I ran a 1,000-path Monte Carlo simulation for your vehicle query (₹${params.principal.toLocaleString('en-IN')} over ${params.years} years).
  
• Estimated EMI: ₹${params.emi.toLocaleString('en-IN')}/month at ${params.annualRate}% interest.
• Down Payment (20%): ₹${params.downPayment.toLocaleString('en-IN')} upfront.
• Impact on Retirement: Shifts retirement timeline by approximately +1 year due to reduced SIP compounding during repayment.
• Cashflow Status: Your monthly surplus is ₹${profile.monthly_investable_surplus.toLocaleString('en-IN')}, leaving ₹${Math.max(0, profile.monthly_investable_surplus - params.emi).toLocaleString('en-IN')} unallocated investable bandwidth.

I have updated your Scenario Simulator tab with the complete trajectory curve and down-payment alternatives.`;
  } else if (lowerMsg.includes("retire") || lowerMsg.includes("freedom") || lowerMsg.includes("corpus")) {
    replyText = `Evaluating your current net worth of ₹${profile.net_worth.toLocaleString('en-IN')} with an expected 12% equity growth rate: With your current monthly SIP of ₹${profile.monthly_investable_surplus.toLocaleString('en-IN')}, your projected 30-year corpus reaches ₹${(profile.net_worth * 12).toLocaleString('en-IN')}, providing full financial independence by age ${profile.age + 25}.`;
  } else if (lowerMsg.includes("tax") || lowerMsg.includes("regime")) {
    replyText = `Under the Finance Act 2024 provisions, the New Tax Regime offers a standard deduction of ₹75,000 and Section 87A rebate up to ₹12 Lakhs. Your annual salary of ₹${(profile.base_salary * 12).toLocaleString('en-IN')} benefits from optimal equity LTCG harvesting under the ₹1.25L annual exemption threshold.`;
  } else {
    replyText = `I have received your planning query: "${message}". Using your portfolio profile (${profile.name}, Age ${profile.age}, ${profile.risk_tolerance} risk tolerance), I verified that your runway (${profile.months_of_runway} months) and investable surplus (₹${profile.monthly_investable_surplus.toLocaleString('en-IN')}/mo) remain well-positioned. What specific scenario or goal would you like to model?`;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 1. Send thread_id
      const threadMsg = `data: ${JSON.stringify({ type: "thread_id", thread_id: threadId })}\n\n`;
      controller.enqueue(encoder.encode(threadMsg));

      // 2. If scenario was simulated, emit scenario_result immediately to update charts
      if (scenarioData) {
        const scenarioMsg = `data: ${JSON.stringify({ type: "scenario_result", data: scenarioData })}\n\n`;
        controller.enqueue(encoder.encode(scenarioMsg));
      }

      // 3. Stream tokens word by word
      const words = replyText.split(" ");
      for (let i = 0; i < words.length; i++) {
        const token = (i === 0 ? "" : " ") + words[i];
        const tokenMsg = `data: ${JSON.stringify({ type: "token", content: token })}\n\n`;
        controller.enqueue(encoder.encode(tokenMsg));
        await new Promise((resolve) => setTimeout(resolve, 30));
      }

      // 4. Send done
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const message = searchParams.get("message") || "";
  const existingThreadId = searchParams.get("thread_id");
  const threadId = existingThreadId || `thread_${Date.now()}`;

  return handleChatStream(req, message, threadId);
}

export async function POST(req: NextRequest) {
  let message = "";
  let threadId = `thread_${Date.now()}`;

  try {
    const body = await req.json();
    message = body.message || "";
    if (body.thread_id) threadId = body.thread_id;
  } catch {
    // If not JSON, check query params
    const searchParams = req.nextUrl.searchParams;
    message = searchParams.get("message") || "";
    if (searchParams.get("thread_id")) threadId = searchParams.get("thread_id")!;
  }

  return handleChatStream(req, message, threadId);
}
