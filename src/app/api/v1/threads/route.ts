import { NextRequest, NextResponse } from "next/server";

const mockThreads = [
  {
    id: "thread_quant_retirement_01",
    user_id: 1,
    title: "Retirement Corpus & Goal Feasibility",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "thread_vehicle_loan_02",
    user_id: 1,
    title: "Vehicle Loan Prepayment Impact",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(mockThreads);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader) {
    return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
  }

  const newThread = {
    id: `thread_${Date.now()}`,
    user_id: 1,
    title: "Interactive Planning Session",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return NextResponse.json(newThread, { status: 201 });
}
