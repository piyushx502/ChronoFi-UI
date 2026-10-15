import { NextRequest, NextResponse } from "next/server";
import { getProfileByAuth } from "../../profile/store";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      shock_type = "job_loss",
      shock_duration_months = 6,
      income_reduction_pct = 100.0,
      lump_sum_cost = 0.0,
    } = body;

    const profile = getProfileByAuth(authHeader);
    const monthly_expenses = profile.monthly_expenses || 35000;
    const base_salary = profile.base_salary || 80000;
    const existing_liabilities_monthly = profile.liabilities.reduce(
      (sum, l) => sum + (Number(l.monthly_payment) || 0),
      0
    );

    const burn_rate = monthly_expenses + existing_liabilities_monthly;
    const recommended_emergency_fund = Math.round(burn_rate * 6);

    // 1. Bucket assets into tiers
    const tier1_names: string[] = [];
    const tier2_names: string[] = [];
    const tier3_names: string[] = [];
    const tier4_names: string[] = [];

    let t1_val = 0, t2_val = 0, t3_val = 0, t4_val = 0;

    for (const a of profile.assets) {
      const val = Number(a.current_value) || 0;
      const atype = (a.asset_type || "").toLowerCase();
      const name = a.name || "Asset";

      if (/cash|liquid|savings|checking|wallet/.test(atype)) {
        tier1_names.push(name);
        t1_val += val;
      } else if (/fd|fixed deposit|term|recurring/.test(atype)) {
        tier2_names.push(name);
        t2_val += val;
      } else if (/debt|bond|g-sec|treasury/.test(atype)) {
        tier3_names.push(name);
        t3_val += val;
      } else {
        tier4_names.push(name);
        t4_val += val;
      }
    }

    const initial_total_wealth = t1_val + t2_val + t3_val + t4_val;
    const emergency_fund_gap = Math.max(0, Math.round(recommended_emergency_fund - t1_val));

    // 2. Simulate month by month
    let curr_t1 = t1_val;
    let curr_t2 = t2_val;
    let curr_t3 = t3_val;
    let curr_t4 = t4_val;

    let total_friction = 0;
    let t1_drained = 0;
    let t2_drained = 0;
    let t3_drained = 0;
    let t4_drained = 0;

    const simulation_horizon = Math.max(24, shock_duration_months + 12);
    const trajectory: any[] = [];
    let insolvency_month: number | null = null;
    let survived_months = 0;

    let total_shock_outflow = 0;

    for (let m = 1; m <= simulation_horizon; m++) {
      let month_income = base_salary;
      if (m <= shock_duration_months) {
        const factor = Math.max(0, Math.min(1, 1 - income_reduction_pct / 100));
        month_income = base_salary * factor;
      }

      const month_outflow = burn_rate + (m === 1 ? lump_sum_cost : 0);
      const net_deficit = Math.max(0, month_outflow - month_income);
      total_shock_outflow += net_deficit;

      let needed = net_deficit;

      // Tier 1: Cash (0% friction)
      if (needed > 0 && curr_t1 > 0) {
        const take = Math.min(curr_t1, needed);
        curr_t1 -= take;
        t1_drained += take;
        needed -= take;
      }

      // Tier 2: FD (1% friction)
      if (needed > 0 && curr_t2 > 0) {
        const take_gross = Math.min(curr_t2, needed / 0.99);
        const net_received = take_gross * 0.99;
        const friction = take_gross * 0.01;
        curr_t2 -= take_gross;
        t2_drained += take_gross;
        total_friction += friction;
        needed -= net_received;
      }

      // Tier 3: Debt Mutual Funds (2% friction)
      if (needed > 0 && curr_t3 > 0) {
        const take_gross = Math.min(curr_t3, needed / 0.98);
        const net_received = take_gross * 0.98;
        const friction = take_gross * 0.02;
        curr_t3 -= take_gross;
        t3_drained += take_gross;
        total_friction += friction;
        needed -= net_received;
      }

      // Tier 4: Equity (15% haircut)
      if (needed > 0 && curr_t4 > 0) {
        const take_gross = Math.min(curr_t4, needed / 0.85);
        const net_received = take_gross * 0.85;
        const friction = take_gross * 0.15;
        curr_t4 -= take_gross;
        t4_drained += take_gross;
        total_friction += friction;
        needed -= net_received;
      }

      const remaining_wealth = curr_t1 + curr_t2 + curr_t3 + curr_t4;
      const is_solvent = needed <= 0.01;

      if (!is_solvent && insolvency_month === null) {
        insolvency_month = m;
      }
      if (is_solvent && insolvency_month === null) {
        survived_months += 1;
      }

      trajectory.push({
        month: m,
        income: Math.round(month_income),
        expenses: Math.round(monthly_expenses),
        debt_service: Math.round(existing_liabilities_monthly),
        net_deficit: Math.round(net_deficit),
        remaining_total_wealth: Math.round(remaining_wealth),
        tier1_liquid_remaining: Math.round(curr_t1),
        tier2_fd_remaining: Math.round(curr_t2),
        tier3_debt_remaining: Math.round(curr_t3),
        tier4_equity_remaining: Math.round(curr_t4),
        is_solvent,
      });
    }

    const is_solvent_through_shock = insolvency_month === null || insolvency_month > shock_duration_months;
    const final_wealth = Math.round(curr_t1 + curr_t2 + curr_t3 + curr_t4);

    let resilience_rating = "Adequate";
    if (insolvency_month !== null && insolvency_month <= 3) {
      resilience_rating = "Critical";
    } else if (insolvency_month !== null && insolvency_month <= shock_duration_months) {
      resilience_rating = "Vulnerable";
    } else if (t1_drained <= t1_val && t2_drained === 0) {
      resilience_rating = "Robust";
    }

    const actionable_advice: string[] = [];
    if (t1_val < recommended_emergency_fund) {
      actionable_advice.push(
        `Build Emergency Reserve: Your pure liquid cash (₹${t1_val.toLocaleString('en-IN')}) covers ${(t1_val / burn_rate).toFixed(1)} months of burn. Target ₹${recommended_emergency_fund.toLocaleString('en-IN')} (6 months).`
      );
    }
    if (t4_drained > 0) {
      actionable_advice.push(
        `Avoid Equity Fire-Sales: The shock forced liquidating ₹${Math.round(t4_drained).toLocaleString('en-IN')} of equity, incurring ₹${Math.round(t4_drained * 0.15).toLocaleString('en-IN')} in market timing/haircut friction.`
      );
    }
    if (is_solvent_through_shock) {
      actionable_advice.push(
        `Solvency Intact: Your balance sheet absorbs the full ${shock_duration_months}-month shock with ₹${final_wealth.toLocaleString('en-IN')} in preserved wealth.`
      );
    }

    const asset_tiers = [
      {
        tier_name: "Tier 1: Cash & Liquid",
        asset_names: tier1_names.length ? tier1_names : ["Cash Reserves"],
        initial_value: Math.round(t1_val),
        liquidated_value: Math.round(t1_drained),
        remaining_value: Math.round(curr_t1),
        friction_cost: 0,
      },
      {
        tier_name: "Tier 2: Term Deposits",
        asset_names: tier2_names.length ? tier2_names : ["Fixed Deposits"],
        initial_value: Math.round(t2_val),
        liquidated_value: Math.round(t2_drained),
        remaining_value: Math.round(curr_t2),
        friction_cost: Math.round(t2_drained * 0.01),
      },
      {
        tier_name: "Tier 3: Debt Mutual Funds",
        asset_names: tier3_names.length ? tier3_names : ["Bonds / Debt MFs"],
        initial_value: Math.round(t3_val),
        liquidated_value: Math.round(t3_drained),
        remaining_value: Math.round(curr_t3),
        friction_cost: Math.round(t3_drained * 0.02),
      },
      {
        tier_name: "Tier 4: Equity & Growth",
        asset_names: tier4_names.length ? tier4_names : ["Equities"],
        initial_value: Math.round(t4_val),
        liquidated_value: Math.round(t4_drained),
        remaining_value: Math.round(curr_t4),
        friction_cost: Math.round(t4_drained * 0.15),
      },
    ];

    return NextResponse.json({
      scenario_name: `${shock_type.replace('_', ' ').toUpperCase()} (${shock_duration_months} Months)`,
      shock_type,
      shock_duration_months,
      monthly_burn_rate: Math.round(burn_rate),
      net_monthly_deficit: Math.round(total_shock_outflow / shock_duration_months),
      total_shock_cost: Math.round(total_shock_outflow),
      survival_runway_months: survived_months,
      is_solvent_through_shock,
      insolvency_month,
      total_wealth_before: Math.round(initial_total_wealth),
      total_wealth_after: final_wealth,
      total_friction_losses: Math.round(total_friction),
      recommended_emergency_fund,
      emergency_fund_gap,
      resilience_rating,
      asset_tiers,
      monthly_trajectory: trajectory,
      actionable_advice,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Stress test simulation failed" },
      { status: 500 }
    );
  }
}
