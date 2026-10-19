import { NextRequest, NextResponse } from "next/server";
import { addLiabilityByAuth } from "../store";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!authHeader.includes("demo-jwt-token")) {
      try {
        const backendRes = await fetch("http://127.0.0.1:8000/api/profile/liabilities", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: authHeader },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(3000),
        });
        if (backendRes.ok) {
          return NextResponse.json(await backendRes.json());
        }
      } catch {
        // Backend offline; proceed with store
      }
    }

    const updated = addLiabilityByAuth(authHeader, {
      name: body.name || "New Liability",
      principal_remaining: Number(body.principal_remaining) || 0,
      interest_rate: Number(body.interest_rate) || 0.09,
      monthly_payment: Number(body.monthly_payment) || 0,
      currency: body.currency || "INR",
    });

    return NextResponse.json({ message: "Liability added successfully", profile: updated }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ detail: (err as Error).message || "Failed to add liability" }, { status: 400 });
  }
}
