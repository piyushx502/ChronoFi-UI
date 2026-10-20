import { BACKEND_URL } from "@/lib/api-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const idToken = typeof body.id_token === "string" ? body.id_token.trim() : "";

    if (!idToken) {
      return NextResponse.json(
        { detail: "Google identity token (id_token) is required." },
        { status: 400 }
      );
    }

    // Forward verification to ChronoFi FastAPI backend on port 8000
    try {
      const backendController = new AbortController();
      const timeoutId = setTimeout(() => backendController.abort(), 8000);

      const backendRes = await fetch(BACKEND_URL + "/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: idToken }),
        signal: backendController.signal,
      });
      clearTimeout(timeoutId);

      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    } catch {
      return NextResponse.json(
        { detail: "Authentication backend service is currently unreachable. Please ensure the backend is running." },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Internal authentication error" },
      { status: 500 }
    );
  }
}
