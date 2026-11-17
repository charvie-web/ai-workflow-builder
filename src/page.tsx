
"use client";

import { useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus,
  Play,
  Save,
  Sparkles,
  GitBranch,
  Workflow,
  Settings2,
} from "lucide-react";

type DecisionData = {
  label: string;
  prompt: string;
};

function DecisionNode({ data }: { data: DecisionData }) {
  return (
    <div className="w-64 rounded-xl border border-slate-300 bg-white shadow-lg">
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2 rounded-t-xl bg-slate-900 px-4 py-3 text-white">
        <GitBranch size={16} />
        <span className="font-semibold">{data.label}</span>
      </div>
      <div className="p-4">
        <p className="mb-2 text-xs font-medium text-slate-500">
          AI DECISION PROMPT
        </p>
        <p className="text-sm text-slate-700">{data.prompt}</p>
        <div className="mt-4 flex justify-between text-xs font-semibold">
          <span className="text-green-600">YES</span>
          <span className="text-red-600">NO</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: "30%", background: "#16a34a" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: "70%", background: "#dc2626" }}
      />
    </div>
  );
}

const nodeTypes = { decision: DecisionNode };

const initialNodes: Node<DecisionData>[] = [
  {
    id: "1",
    type: "decision",
    position: { x: 300, y: 120 },
    data: {
      label: "Decision 1",
      prompt: "Is this a support request?",
    },
  },
];

export default function Home() {
  const [nodes, setNodes, onNodesChange] =
    useNodesState(initialNodes);

  const [edges, setEdges, onEdgesChange] =
    useEdgesState<Edge>([]);

  const [selectedNode, setSelectedNode] =
    useState<string | null>("1");

    const [executionLogs, setExecutionLogs] = useState<
  { nodeName: string; decision: string; source: string }[]
>([]);

    const [isRunning, setIsRunning] = useState(false);
const [runMessage, setRunMessage] = useState("");

    useEffect(() => {
  const saved = localStorage.getItem("flowai-workflow");

  if (saved) {
    try {
      const workflow = JSON.parse(saved);

      if (
        Array.isArray(workflow.nodes) &&
        Array.isArray(workflow.edges)
      ) {
        setNodes(workflow.nodes);
        setEdges(workflow.edges);

        setSelectedNode(
          workflow.nodes.length > 0
            ? workflow.nodes[0].id
            : null
        );
      }
    } catch {
      console.error("Could not load saved workflow.");
    }
  }
}, [setNodes, setEdges]);

const saveWorkflow = () => {
  localStorage.setItem(
    "flowai-workflow",
    JSON.stringify({ nodes, edges })
  );
  alert("Workflow saved successfully!");
};

const runWorkflow = async () => {
  if (nodes.length === 0) {
    setRunMessage("Add at least one decision node.");
    return;
  }

  setIsRunning(true);
  setExecutionLogs([]);
  setRunMessage("Running workflow...");

  try {
    const response = await fetch("/api/workflow/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nodes, edges }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Could not start workflow.");
    }

    let completed = false;

    for (let attempt = 0; attempt < 60; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const resultResponse = await fetch(
        `/api/workflow/result/${result.runId}`
      );

      if (resultResponse.ok) {
        const execution = await resultResponse.json();

        if (execution.status === "completed") {
          setExecutionLogs(execution.logs);
          setRunMessage(
            `Workflow completed successfully. ${execution.visitedNodes} nodes executed.`
          );
          completed = true;
          break;
        }
      }
    }

    if (!completed) {
      setRunMessage("Workflow is taking longer than expected. Check Inngest.");
    }
  } catch (error) {
    setRunMessage(
      error instanceof Error ? error.message : "Something went wrong."
    );
  } finally {
    setIsRunning(false);
  }
};
  

  const addNode = () => {
    const id = crypto.randomUUID();

    const newNode: Node<DecisionData> = {
      id,
      type: "decision",
      position: { x: 200 + nodes.length * 40, y: 300 },
      data: {
        label: `Decision ${nodes.length + 1}`,
        prompt: "Enter your decision prompt here.",
      },
    };

    setNodes((current) => [...current, newNode]);
    setSelectedNode(id);
  };

  const onConnect = (connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          label: connection.sourceHandle?.toUpperCase() || "",
          animated: true,
          style: {
            stroke:
              connection.sourceHandle === "yes"
                ? "#16a34a"
                : "#dc2626",
            strokeWidth: 2,
          },
        },
        current
      )
    );
  };

const updateNodeName = (label: string) => {
  setNodes((current) =>
    current.map((node) =>
      node.id === selectedNode
        ? { ...node, data: { ...node.data, label } }
        : node
    )
  );
};
  
  const updatePrompt = (prompt: string) => {
    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode
          ? { ...node, data: { ...node.data, prompt } }
          : node
      )
    );
  };

  const activeNode = nodes.find(
    (node) => node.id === selectedNode
  );

  return (
    <main className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-900 p-2 text-white">
            <Workflow size={20} />
          </div>
          <div>
            <h1 className="font-bold">FlowAI</h1>
            <p className="text-xs text-slate-500">
              AI Workflow Builder
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addNode}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Plus size={16} /> Add Node
          </button>
          <button
  onClick={saveWorkflow}
  className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
>
  <Save size={16} /> Save
</button>
          <button
  onClick={runWorkflow}
  disabled={isRunning}
  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
>
  <Play size={16} />
  {isRunning ? "Running..." : "Run Workflow"}
</button>
        </div>
      </header>

      {runMessage && (
  <div className="bg-white px-6 py-2 text-sm text-slate-700">
    {runMessage}
  </div>
)}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-60 border-r bg-white p-5">
          <p className="mb-4 text-xs font-semibold tracking-wider text-slate-400">
            WORKFLOW
          </p>
          <div className="rounded-lg border bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <Sparkles size={16} /> My First Workflow
            </div>
            <p className="text-xs text-slate-500">
              Build AI-powered YES/NO decisions.
            </p>
          </div>

          <p className="mb-3 mt-8 text-xs font-semibold tracking-wider text-slate-400">
            TOOLS
          </p>
          <button
            onClick={addNode}
            className="flex w-full items-center gap-2 rounded-lg p-3 text-sm hover:bg-slate-100"
          >
            <Plus size={16} /> Decision Node
          </button>
        </aside>

        <section className="relative flex-1">
          <div className="absolute left-5 top-5 z-10 rounded-lg border bg-white px-3 py-2 text-xs shadow-sm">
            {nodes.length} nodes · {edges.length} connections
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNode(node.id)}
            fitView
          >
            <Background gap={20} color="#cbd5e1" />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </section>

        <aside className="w-72 border-l bg-white p-5">
          <div className="mb-5 flex items-center gap-2 font-semibold">
            <Settings2 size={18} /> Node Settings
          </div>

          {activeNode ? (
            <>
              <label className="mb-2 block text-xs font-medium text-slate-500">
                NODE NAME
              </label>
              <input
  value={activeNode.data.label}
  onChange={(event) => updateNodeName(event.target.value)}
  className="mb-5 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
/>

              <label className="mb-2 block text-xs font-medium text-slate-500">
                DECISION PROMPT
              </label>
              <textarea
                value={activeNode.data.prompt}
                onChange={(event) =>
                  updatePrompt(event.target.value)
                }
                className="min-h-32 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 focus:ring-slate-400"
              />

              <div className="mt-5 rounded-lg bg-green-50 p-3 text-xs text-green-700">
                YES → Green connection
              </div>
              <div className="mt-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                NO → Red connection
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Select a node to edit its prompt.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
