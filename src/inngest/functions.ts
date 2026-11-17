
import { inngest } from "@/lib/inngest";
import { getGeminiDecision } from "@/lib/gemini";
import { saveWorkflowResult } from "@/lib/workflow-results";

export const runWorkflow = inngest.createFunction(
  {
    id: "run-ai-workflow",
    triggers: { event: "workflow/run" },
  },
  async ({ event, step }) => {
const { runId, nodes, edges } = event.data as {
  runId: string;
        nodes: {
        id: string;
        data: { label?: string; prompt?: string };
      }[];
      edges: {
        source: string;
        target: string;
        sourceHandle?: string | null;
      }[];
    };

    const logs: {
      nodeId: string;
      nodeName: string;
      decision: string;
      source: string;
    }[] = [];

    const startNode = nodes.find(
      (node) => !edges.some((edge) => edge.target === node.id)
    );

    if (!startNode) {
      throw new Error("No starting node found.");
    }

    let currentNode = startNode;
    const visited = new Set<string>();

    while (currentNode) {
      if (visited.has(currentNode.id)) {
        throw new Error("Workflow contains a cycle.");
      }

      visited.add(currentNode.id);

      const result = await step.run(
        `decision-${currentNode.id}`,
        async () => {
          return await getGeminiDecision(
            currentNode.data.prompt || "Answer YES."
          );
        }
      );

      logs.push({
        nodeId: currentNode.id,
        nodeName: currentNode.data.label || currentNode.id,
        decision: result.decision,
        source: result.source,
      });

      const nextEdge = edges.find(
        (edge) =>
          edge.source === currentNode.id &&
          edge.sourceHandle?.toLowerCase() ===
            result.decision.toLowerCase()
      );

      if (!nextEdge) break;

      const nextNode = nodes.find(
        (node) => node.id === nextEdge.target
      );

      if (!nextNode) {
        throw new Error("Connected node not found.");
      }

      currentNode = nextNode;
    }

   const output = {
  status: "completed",
  logs,
  visitedNodes: logs.length,
};

await saveWorkflowResult(runId, output);
return output;
  }
);
