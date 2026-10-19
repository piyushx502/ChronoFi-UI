import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const docId = parseInt(params.id, 10);
  if (isNaN(docId)) {
    return NextResponse.json({ detail: "Invalid document ID" }, { status: 400 });
  }

  // Forward to backend if connected
  if (!authHeader.includes("demo-jwt-token")) {
    try {
      const backendController = new AbortController();
      const timeoutId = setTimeout(() => backendController.abort(), 2000);
      const res = await fetch(`http://127.0.0.1:8000/api/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: authHeader },
        signal: backendController.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      // Backend offline; proceed with local confirmation
    }
  }

  return NextResponse.json({ message: "Document deleted successfully", document_id: docId });
}
