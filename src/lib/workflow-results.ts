import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type WorkflowExecutionResult = {
  status: string;
  logs: {
    nodeId: string;
    nodeName: string;
    decision: string;
    source: string;
  }[];
  visitedNodes: number;
};

const resultsDirectory = join(process.cwd(), ".workflow-results");

export async function saveWorkflowResult(
  runId: string,
  result: WorkflowExecutionResult
) {
  await mkdir(resultsDirectory, { recursive: true });

  await writeFile(
    join(resultsDirectory, `${runId}.json`),
    JSON.stringify(result),
    "utf8"
  );
}

export async function getWorkflowResult(runId: string) {
  try {
    const data = await readFile(
      join(resultsDirectory, `${runId}.json`),
      "utf8"
    );

    return JSON.parse(data) as WorkflowExecutionResult;
  } catch {
    return undefined;
  }
}