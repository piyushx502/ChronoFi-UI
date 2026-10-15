import { NextRequest, NextResponse } from "next/server";
import { deleteLiabilityByAuth } from "../../store";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const liabilityId = parseInt(params.id, 10);
  if (isNaN(liabilityId)) {
    return NextResponse.json({ detail: "Invalid liability ID" }, { status: 400 });
  }

  if (!authHeader.includes("demo-jwt-token")) {
    try {
      const backendRes = await fetch(`http://127.0.0.1:8000/api/profile/liabilities/${liabilityId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
        signal: AbortSignal.timeout(300),
      });
      if (backendRes.ok) {
        return NextResponse.json(await backendRes.json());
      }
    } catch {
      // Backend offline; proceed with store
    }
  }

  const updated = deleteLiabilityByAuth(authHeader, liabilityId);
  return NextResponse.json({ message: "Liability deleted successfully", profile: updated });
}
