import { BACKEND_URL } from "@/lib/api-config";
import { NextRequest, NextResponse } from "next/server";
import { addGoalByAuth } from "../store";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!authHeader.includes("demo-jwt-token")) {
      try {
        const backendRes = await fetch(BACKEND_URL + "/api/profile/goals", {
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

    const updated = addGoalByAuth(authHeader, {
      name: body.name || "New Goal",
      target_amount: Number(body.target_amount) || 0,
      target_years: Number(body.target_years) || 5,
      priority: body.priority || "Essential",
      inflation_rate: Number(body.inflation_rate) || 0.06,
      currency: body.currency || "INR",
    });

    return NextResponse.json({ message: "Goal added successfully", profile: updated }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ detail: (err as Error).message || "Failed to add goal" }, { status: 400 });
  }
}
