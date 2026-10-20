import { BACKEND_URL } from "@/lib/api-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { salary = 0, deductions = 0, agri_income = 0 } = body;

    // 1. Try forwarding to backend
    try {
      const authHeader = req.headers.get("authorization") || "";
      const backendController = new AbortController();
      const timeoutId = setTimeout(() => backendController.abort(), 3000);

      const backendRes = await fetch(BACKEND_URL + "/api/tax/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(body),
        signal: backendController.signal,
      });
      clearTimeout(timeoutId);

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline; calculate locally using FY 26-27 rules
    }

    // 2. Local Tax Calculation (FY 26-27 rules matching backend engine)
    const stdNew = 75000;
    const taxableNew = Math.max(0, salary - stdNew);

    let newTax = 0;
    if (taxableNew <= 400000) newTax = 0;
    else if (taxableNew <= 800000) newTax = (taxableNew - 400000) * 0.05;
    else if (taxableNew <= 1200000) newTax = 20000 + (taxableNew - 800000) * 0.10;
    else if (taxableNew <= 1600000) newTax = 60000 + (taxableNew - 1200000) * 0.15;
    else if (taxableNew <= 2000000) newTax = 120000 + (taxableNew - 1600000) * 0.20;
    else if (taxableNew <= 2400000) newTax = 200000 + (taxableNew - 2000000) * 0.25;
    else newTax = 300000 + (taxableNew - 2400000) * 0.30;

    // Section 87A rebate for New Regime (up to 12L taxable / 12.75L salary)
    if (taxableNew <= 1200000) {
      newTax = 0;
    }

    // Old Regime
    const stdOld = 50000;
    const taxableOld = Math.max(0, salary - stdOld - deductions);

    let oldTax = 0;
    if (taxableOld <= 250000) oldTax = 0;
    else if (taxableOld <= 500000) oldTax = (taxableOld - 250000) * 0.05;
    else if (taxableOld <= 1000000) oldTax = 12500 + (taxableOld - 500000) * 0.20;
    else oldTax = 112500 + (taxableOld - 1000000) * 0.30;

    // Old regime 87A rebate (up to 5L)
    if (taxableOld <= 500000) {
      oldTax = 0;
    }

    return NextResponse.json({
      new_regime_tax: Math.round(newTax),
      new_regime_agri_rebate: 0,
      old_regime_tax: Math.round(oldTax),
      old_regime_agri_rebate: 0,
      recommendation: newTax <= oldTax ? "New Regime" : "Old Regime",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Calculation failed" },
      { status: 500 }
    );
  }
}
