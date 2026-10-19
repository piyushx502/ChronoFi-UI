import { NextRequest, NextResponse } from "next/server";
import { POST as handleDocUpload } from "../route";

export async function POST(req: NextRequest) {
  return handleDocUpload(req);
}
