import { BACKEND_URL } from "@/lib/api-config";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = new URLSearchParams(rawBody);
    const username = params.get("username")?.trim().toLowerCase() || "";
    const password = params.get("password") || "";

    // 1. Instant Persona Authentication (Admin, Arjun, Priya)
    const normalizedEmail = username.includes("@") ? username : (username === "admin" ? "admin@chronofi.com" : `${username}@chronofi.demo`);

    if (
      (normalizedEmail === "admin@chronofi.com" || username === "admin") &&
      (password === "Admin@ChronoFi2026!" || password === "admin123" || password === "password123")
    ) {
      return NextResponse.json({
        access_token: "admin-jwt-token-" + Date.now(),
        token_type: "bearer",
        user_id: 3,
      });
    }

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

      const backendRes = await fetch(BACKEND_URL + "/api/auth/token", {
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
