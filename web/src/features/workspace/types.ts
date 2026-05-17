import type { Edge, Node } from "@xyflow/react";
import type {
  CoreGraph,
  CoreProjectMetadata,
  RuntimeDiagnostic,
  RuntimeEvent,
  Spark,
  WorkflowActivitySummary,
} from "@/features/workspace/contracts";

export type NodeStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting"
  | "done"
  | "failed"
  | "blocked";
export type InspectorTab = "project" | "node";
export type WorkspaceView = "dashboard" | "workflow";

export type WorkflowNodeData = Record<string, unknown> & {
  label: string;
  app: string;
  description: string;
  status: NodeStatus;
  connector: string;
  sparkIds?: string[];
};

export type WorkflowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowEdgeData = Record<string, unknown> & {
  routingLabel?: string | null;
};
export type WorkflowEdge = Edge<WorkflowEdgeData>;

export type ProjectMetadata = CoreProjectMetadata;

export type WorkflowGraphData = {
  id: string;
  projectId: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  coreGraph: CoreGraph;
};

export type WorkflowActivity = WorkflowActivitySummary;

export type Project = {
  metadata: ProjectMetadata;
  workflows: WorkflowGraphData[];
  activity: WorkflowActivity;
  diagnostics: RuntimeDiagnostic[];
  sparks: Record<string, Spark>;
  eventLog: RuntimeEvent[];
};

export type CatalogNode = {
  id: string;
  label: string;
  app: string;
  description: string;
  connector: string;
  capabilities: string[];
  configSchemaHints: string[];
  inputSchemaHints: string[];
  outputSchemaHints: string[];
};

export type CatalogDiagnostic = {
  path: string;
  message: string;
  nodeId?: string | null;
};

export type ProjectField = "name" | "cwd" | "owner" | "description" | "trigger";
