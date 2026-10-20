import { BACKEND_URL } from "@/lib/api-config";
import { NextRequest, NextResponse } from "next/server";
import { addAssetByAuth } from "../store";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!authHeader.includes("demo-jwt-token")) {
      try {
        const backendRes = await fetch(BACKEND_URL + "/api/profile/assets", {
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

    const updated = addAssetByAuth(authHeader, {
      name: body.name || "New Asset",
      asset_type: body.asset_type || "Equity",
      current_value: Number(body.current_value) || 0,
      expected_return_rate: Number(body.expected_return_rate) || 0.1,
      currency: body.currency || "INR",
    });

    return NextResponse.json({ message: "Asset added successfully", profile: updated }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ detail: (err as Error).message || "Failed to add asset" }, { status: 400 });
  }
}
