import { NextResponse } from "next/server";
import { getWorkflowResult } from "@/lib/workflow-results";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
const result = await getWorkflowResult(runId);
  if (!result) {
    return NextResponse.json({ status: "pending" }, { status: 202 });
  }

  return NextResponse.json(result);
}