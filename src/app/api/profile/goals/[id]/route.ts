import { NextRequest, NextResponse } from "next/server";
import { deleteGoalByAuth } from "../../store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const goalId = parseInt(params.id, 10);
  if (isNaN(goalId)) {
    return NextResponse.json({ detail: "Invalid goal ID" }, { status: 400 });
  }

  if (!authHeader.includes("demo-jwt-token")) {
    try {
      const backendRes = await fetch(`http://127.0.0.1:8000/api/profile/goals/${goalId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(3000),
      });
      if (backendRes.ok) {
        return NextResponse.json(await backendRes.json());
      }
    } catch {
      // Backend offline; proceed with store
    }
  }

  const updated = deleteGoalByAuth(authHeader, goalId);
  return NextResponse.json({ message: "Goal deleted successfully", profile: updated });
}
