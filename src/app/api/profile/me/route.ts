import { NextRequest, NextResponse } from "next/server";
import { getProfileByAuth, updateProfileByAuth } from "../store";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  // 1. If real backend JWT (not a demo token), attempt to delegate to backend on port 8000
  if (!authHeader.includes("demo-jwt-token")) {
    try {
      const backendController = new AbortController();
      const timeoutId = setTimeout(() => backendController.abort(), 3000);

      const backendRes = await fetch("http://127.0.0.1:8000/api/profile/me", {
        headers: { Authorization: authHeader },
        signal: backendController.signal,
      });
      clearTimeout(timeoutId);

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend offline; proceed with persona profile store
    }
  }

  // 2. Return persona profile with full calculated metrics
  const profile = getProfileByAuth(authHeader);
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";

  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 1. If real backend JWT, attempt to delegate to backend on port 8000
    if (!authHeader.includes("demo-jwt-token")) {
      try {
        const backendController = new AbortController();
        const timeoutId = setTimeout(() => backendController.abort(), 3000);

        const backendRes = await fetch("http://127.0.0.1:8000/api/profile/me", {
          method: "PUT",
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
        // Backend offline; proceed with local store
      }
    }

    // 2. Update local profile store and return recalculated profile
    const updated = updateProfileByAuth(authHeader, body);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    return NextResponse.json(
      { detail: (err as Error).message || "Failed to update profile" },
      { status: 400 }
    );
  }
}
