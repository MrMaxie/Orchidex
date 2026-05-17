import type { CoreGraph } from "@/features/workspace/contracts";
import type { CatalogNode, Project, ProjectGroup, WorkflowEdge, WorkflowNode } from "@/features/workspace/types";

export const projectGroups: ProjectGroup[] = [
  {
    id: "automation",
    title: "Automation",
    hint: "Spark-driven project graphs backed by Orchidex Core.",
  },
  {
    id: "debug",
    title: "Debug",
    hint: "Fixture graphs and runtime probes.",
  },
];

export const nodeCatalog: CatalogNode[] = [
  node("std/manual-ignite", "Manual Ignite", "Std", "Input", "Starts a spark from user-provided form data."),
  node("std/transmute", "Transmute", "Std", "Rhai", "Transforms payloads with Rhai."),
  node("std/accumulation", "Accumulation", "Std", "Queue", "Queues sparks and releases them by policy."),
  node("std/filter", "Filter", "Std", "Rules", "Filters sparks by payload data."),
  node("std/merge", "Merge", "Std", "Merge", "Merges compatible incoming sparks."),
  node("std/manual-accept", "Manual Accept", "Std", "Gate", "Requires user acceptance before continuing."),
  node("debug/log", "Log", "Debug", "Log", "Writes spark data to the debug log."),
  node("std/sleep", "Sleep", "Std", "Delay", "Delays spark execution."),
  node("codex/exec", "Codex Exec", "Codex", "CLI", "Runs fixture-first Codex CLI prompts."),
  node("debug/placeholder-echo", "Placeholder Echo", "Debug", "Echo", "Emits the same payload it receives."),
  node("debug/placeholder-rhai", "Placeholder Rhai", "Debug", "Rhai", "Emits a changed payload."),
  node("debug/note", "Note", "Debug", "Note", "Stores a visual note without execution ports."),
  node("std/cron", "Cron", "Std", "Schedule", "Ignites work on a schedule."),
  node("std/freezer", "Freezer", "Std", "Memory", "Freezes an output permanently."),
  node("std/cache", "Cache", "Std", "Cache", "Skips repeated input/output mappings."),
];

const clientsProjectGraph: CoreGraph = {
  id: "clients-project",
  name: "Clients project",
  nodes: [
    {
      id: "manual-start",
      kind: "std/manual-ignite",
      label: "Manual intake",
      position: { x: 0, y: 120 },
      config: {},
    },
    {
      id: "mail-accumulation",
      kind: "std/accumulation",
      label: "Mail queue",
      position: { x: 300, y: 120 },
      config: { order: "fifo", locked: false },
    },
    {
      id: "extract-work",
      kind: "std/transmute",
      label: "Extract work items",
      position: { x: 600, y: 120 },
      config: { script: "payload" },
    },
    {
      id: "codex-branch",
      kind: "codex/exec",
      label: "Select branch",
      position: { x: 900, y: 60 },
      config: { model: "5.3-Codex-Spark", effort: "medium" },
    },
    {
      id: "codex-plan",
      kind: "codex/exec",
      label: "Split tasks",
      position: { x: 1200, y: 120 },
      config: { model: "5.3", effort: "high" },
    },
  ],
  edges: [
    { id: "manual-to-queue", source: "manual-start", target: "mail-accumulation", label: "release" },
    { id: "queue-to-extract", source: "mail-accumulation", target: "extract-work", label: "one by one" },
    { id: "extract-to-branch", source: "extract-work", target: "codex-branch", label: "task payload" },
    { id: "branch-to-plan", source: "codex-branch", target: "codex-plan", label: "ready branch" },
  ],
};

export const initialProjects: Project[] = [projectFromCoreGraph(clientsProjectGraph)];

export function projectFromCoreGraph(graph: CoreGraph): Project {
  return {
    id: graph.id,
    name: graph.name,
    groupId: "automation",
    status: "idle",
    progress: 0,
    owner: "Core",
    updatedAt: "Live",
    description: "Fixture-backed spark graph for clients-project acceptance work.",
    trigger: "Manual ignite",
    nodes: graph.nodes.map(toWorkflowNode),
    edges: graph.edges.map(toWorkflowEdge),
    coreGraph: graph,
    sparks: {},
    eventLog: [],
  };
}

export function workflowToCoreGraph(project: Project): CoreGraph {
  return {
    ...project.coreGraph,
    name: project.name,
    nodes: project.nodes.map((node) => ({
      id: node.id,
      kind: node.data.connector,
      label: node.data.label,
      position: node.position,
      config: project.coreGraph.nodes.find((coreNode) => coreNode.id === node.id)?.config ?? {},
    })),
    edges: project.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: typeof edge.label === "string" ? edge.label : null,
    })),
  };
}

function toWorkflowNode(node: CoreGraph["nodes"][number]): WorkflowNode {
  return {
    id: node.id,
    type: "workflowNode",
    position: node.position,
    data: {
      label: node.label,
      app: node.kind.split("/")[0],
      connector: node.kind,
      description: `Runtime node ${node.kind}`,
      status: "idle",
      sparkIds: [],
    },
  };
}

function toWorkflowEdge(edge: CoreGraph["edges"][number]): WorkflowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    animated: true,
    label: edge.label ?? "spark",
    style: { stroke: "var(--workflow-edge)", strokeWidth: 2 },
  };
}

function node(
  id: string,
  label: string,
  app: string,
  connector: string,
  description: string,
): CatalogNode {
  return { id, label, app, connector, description };
}
