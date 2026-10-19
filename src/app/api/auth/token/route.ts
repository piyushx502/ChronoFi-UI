import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const username = params.get("username")?.trim().toLowerCase() || "";
    const password = params.get("password") || "";

    // 1. Instant Demo Persona Authentication (Zero-latency login for Arjun & Priya)
    const normalizedEmail = username.includes("@") ? username : `${username}@chronofi.demo`;

    if (
      (normalizedEmail === "arjun@chronofi.demo" || username === "arjun") &&
      password === "password123"
    ) {
      return NextResponse.json({
        access_token: "demo-jwt-token-arjun-" + Date.now(),
        token_type: "bearer",
        user_id: 1,
      });
    }

    if (
      (normalizedEmail === "priya@chronofi.demo" || username === "priya") &&
      password === "password123"
    ) {
      return NextResponse.json({
        access_token: "demo-jwt-token-priya-" + Date.now(),
        token_type: "bearer",
        user_id: 2,
      });
    }

    // 2. If non-demo credentials, attempt forwarding to backend on port 8000
    try {
      const backendController = new AbortController();
      const timeoutId = setTimeout(() => backendController.abort(), 3000);

      const backendRes = await fetch("http://127.0.0.1:8000/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: rawBody,
        signal: backendController.signal,
      });
      clearTimeout(timeoutId);

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      } else if (backendRes.status === 401 || backendRes.status === 400) {
        const errData = await backendRes.json().catch(() => ({}));
        return NextResponse.json(
          { detail: errData.detail || "Incorrect email or password" },
          { status: 401 }
        );
      }
    } catch {
      // Backend offline or unreachable; fall through to 401
    }

    return NextResponse.json(
      { detail: "Incorrect email or password" },
      { status: 401 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Internal auth error" },
      { status: 500 }
    );
  }
}
