import { NextRequest, NextResponse } from "next/server";

const mockDocuments = [
  {
    id: 1,
    filename: "Form16_FY2025_26.pdf",
    status: "PROCESSED",
    size_bytes: 421800,
    document_type: "Form 16 Tax Certificate",
    financial_year: "2025-26",
    issuer: "Employer / Tax Deductor",
  },
  {
    id: 2,
    filename: "MutualFund_CAS_Statement.pdf",
    status: "PROCESSED",
    size_bytes: 1245000,
    document_type: "CAMS Consolidated Account Statement",
    financial_year: "2025-26",
    issuer: "CAMS / KFintech",
  },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(mockDocuments);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    const newDoc = {
      id: Date.now(),
      filename: file.name,
      status: "PROCESSED",
      size_bytes: file.size,
      document_type: "Financial Record",
      financial_year: "2025-26",
      issuer: "Verified Document Upload",
    };

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { detail: (error as Error).message || "Upload failed" },
      { status: 500 }
    );
  }
}
