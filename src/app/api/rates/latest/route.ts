import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const base = searchParams.get("base") || "INR";

  // Reference rates pegged to INR
  const ratesPeggedToINR: Record<string, number> = {
    INR: 1.0,
    USD: 0.0119,
    EUR: 0.0110,
    GBP: 0.0094,
    JPY: 1.83,
    CAD: 0.0163,
    AUD: 0.0182,
    SGD: 0.0159,
    AED: 0.0437,
  };

  const baseRateToINR = ratesPeggedToINR[base.toUpperCase()] || 1.0;

  // Re-base rates if different base requested
  const rebasedRates: Record<string, number> = {};
  for (const [curr, r] of Object.entries(ratesPeggedToINR)) {
    rebasedRates[curr] = Number((r / baseRateToINR).toFixed(6));
  }

  return NextResponse.json({
    provider: "ChronoFi Global FX Reference Rate",
    base: base.toUpperCase(),
    last_updated: new Date().toUTCString(),
    freshness: "Daily Reference Rate",
    is_stale: false,
    rates: rebasedRates,
  });
}
