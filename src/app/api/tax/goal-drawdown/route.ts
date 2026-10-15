import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      goal_name = "Financial Goal",
      target_years = 5,
      target_amount = 5000000,
      gross_projected_corpus = 6000000,
      total_principal_invested = 3500000,
      equity_pct = 0.6,
      debt_pct = 0.3,
      exempt_pct = 0.1,
      marginal_tax_rate = 0.3,
      inflation_rate = 0.06,
    } = body;

    const years = Math.max(1, Number(target_years) || 1);
    const targetNominal = Math.max(0, Number(target_amount) || 0);
    const grossCorpus = Math.max(0, Number(gross_projected_corpus) || 0);
    const totalPrincipal = Math.max(0, Number(total_principal_invested) || 0);

    let eqW = Math.max(0, Number(equity_pct) || 0);
    let dbW = Math.max(0, Number(debt_pct) || 0);
    let exW = Math.max(0, Number(exempt_pct) || 0);
    const sumW = eqW + dbW + exW;
    if (sumW > 0) {
      eqW /= sumW;
      dbW /= sumW;
      exW /= sumW;
    } else {
      eqW = 0.6;
      dbW = 0.3;
      exW = 0.1;
    }

    const totalGains = Math.max(0, Math.round(grossCorpus - totalPrincipal));

    const eqCorpus = Math.round(grossCorpus * eqW);
    const dbCorpus = Math.round(grossCorpus * dbW);
    const exCorpus = Math.round(grossCorpus * exW);

    const eqPrincipal = Math.round(totalPrincipal * eqW);
    const dbPrincipal = Math.round(totalPrincipal * dbW);
    const exPrincipal = Math.round(totalPrincipal * exW);

    const eqGains = Math.max(0, eqCorpus - eqPrincipal);
    const dbGains = Math.max(0, dbCorpus - dbPrincipal);
    const exGains = Math.max(0, exCorpus - exPrincipal);

    // Equity: Finance Act 2024 LTCG (>1 yr) = 12.5% over 1.25L exemption; STCG (<=1 yr) = 20% flat
    const isLtcg = years > 1;
    const eqExemption = isLtcg ? Math.min(eqGains, 125000) : 0;
    const taxableEqGains = Math.max(0, eqGains - eqExemption);
    const baseEqRate = isLtcg ? 0.125 : 0.20;
    const baseEqTax = taxableEqGains * baseEqRate;
    const eqCess = baseEqTax * 0.04;
    const eqTaxTotal = Math.round(baseEqTax + eqCess);

    // Debt: Section 50AA slab rate + 4% cess
    const baseDbTax = dbGains * marginal_tax_rate;
    const dbCess = baseDbTax * 0.04;
    const dbTaxTotal = Math.round(baseDbTax + dbCess);

    // Tax-exempt
    const exTaxTotal = 0;

    const totalTax = eqTaxTotal + dbTaxTotal + exTaxTotal;
    const totalCess = Math.round(eqCess + dbCess);
    const netCorpus = Math.round(grossCorpus - totalTax);

    const inflatedTarget = Math.round(targetNominal * Math.pow(1 + inflation_rate, years));
    const grossFundingRatio = inflatedTarget > 0 ? Number(((grossCorpus / inflatedTarget) * 100).toFixed(1)) : 100;
    const netFundingRatio = inflatedTarget > 0 ? Number(((netCorpus / inflatedTarget) * 100).toFixed(1)) : 100;
    const postTaxShortfall = Math.max(0, inflatedTarget - netCorpus);

    const effTaxRateGains = totalGains > 0 ? Number(((totalTax / totalGains) * 100).toFixed(2)) : 0;
    const effTaxDragCorpus = grossCorpus > 0 ? Number(((totalTax / grossCorpus) * 100).toFixed(2)) : 0;

    const grossUpTarget = effTaxDragCorpus > 0 && effTaxDragCorpus < 100
      ? Math.round(inflatedTarget / (1 - (effTaxDragCorpus / 100)))
      : inflatedTarget;

    const breakdowns = [
      {
        asset_class: "Equity (Mutual Funds / Stocks)",
        allocation_pct: Number((eqW * 100).toFixed(1)),
        allocated_corpus: eqCorpus,
        allocated_principal: eqPrincipal,
        capital_gains: eqGains,
        tax_rate_applied_pct: Number((baseEqRate * 1.04 * 100).toFixed(2)),
        exemption_claimed: eqExemption,
        taxable_gains: taxableEqGains,
        tax_payable: eqTaxTotal,
        net_post_tax_corpus: eqCorpus - eqTaxTotal,
      },
      {
        asset_class: "Debt (Fixed Income / Debt MFs)",
        allocation_pct: Number((dbW * 100).toFixed(1)),
        allocated_corpus: dbCorpus,
        allocated_principal: dbPrincipal,
        capital_gains: dbGains,
        tax_rate_applied_pct: Number((marginal_tax_rate * 1.04 * 100).toFixed(2)),
        exemption_claimed: 0,
        taxable_gains: dbGains,
        tax_payable: dbTaxTotal,
        net_post_tax_corpus: dbCorpus - dbTaxTotal,
      },
      {
        asset_class: "Tax-Exempt (PPF / EPF / Sovereign)",
        allocation_pct: Number((exW * 100).toFixed(1)),
        allocated_corpus: exCorpus,
        allocated_principal: exPrincipal,
        capital_gains: exGains,
        tax_rate_applied_pct: 0,
        exemption_claimed: exGains,
        taxable_gains: 0,
        tax_payable: 0,
        net_post_tax_corpus: exCorpus,
      },
    ];

    return NextResponse.json({
      goal_name,
      target_years: years,
      target_amount_nominal: targetNominal,
      inflated_target_corpus: inflatedTarget,
      inflation_rate,
      gross_projected_corpus: grossCorpus,
      total_principal_invested: totalPrincipal,
      total_capital_gains: totalGains,
      equity_tax: eqTaxTotal,
      debt_tax: dbTaxTotal,
      cess_amount: totalCess,
      total_tax_liability: totalTax,
      effective_tax_rate_on_gains_pct: effTaxRateGains,
      effective_tax_drag_on_corpus_pct: effTaxDragCorpus,
      net_post_tax_corpus: netCorpus,
      gross_up_target_needed: grossUpTarget,
      required_gross_target_to_meet_net: grossUpTarget,
      surplus_or_shortfall_post_tax: netCorpus - inflatedTarget,
      post_tax_shortfall: postTaxShortfall,
      is_funded_gross: grossCorpus >= inflatedTarget,
      is_funded_net: netCorpus >= inflatedTarget,
      gross_funding_ratio_pct: grossFundingRatio,
      net_funding_ratio_pct: netFundingRatio,
      breakdowns,
      narrative_summary: netCorpus >= inflatedTarget
        ? `Goal is fully funded post-tax. Net corpus of ₹${netCorpus.toLocaleString('en-IN')} exceeds the inflated target of ₹${inflatedTarget.toLocaleString('en-IN')}.`
        : `Post-tax shortfall of ₹${postTaxShortfall.toLocaleString('en-IN')} identified due to ₹${totalTax.toLocaleString('en-IN')} tax drag. Target gross corpus of ₹${grossUpTarget.toLocaleString('en-IN')} recommended.`,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Drawdown tax calculation failed" },
      { status: 500 }
    );
  }
}
