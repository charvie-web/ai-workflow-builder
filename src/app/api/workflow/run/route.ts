import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { inngest } from "@/lib/inngest";

export async function POST(request: Request) {
  try {
    const { nodes, edges } = await request.json();

    if (!Array.isArray(nodes) || !Array.isArray(edges) || nodes.length === 0) {
      return NextResponse.json(
        { error: "A valid workflow is required." },
        { status: 400 }
      );
    }

    const runId = randomUUID();

    const result = await inngest.send({
      name: "workflow/run",
      data: { runId, nodes, edges },
    });

    return NextResponse.json({
      success: true,
      runId,
      eventIds: result.ids,
    });
  } catch (error) {
    console.error("Workflow trigger failed:", error);

    return NextResponse.json(
      { error: "Could not start workflow." },
      { status: 500 }
    );
  }
}