import type { Edge, Node } from "@xyflow/react";
import type { CoreGraph, RuntimeEvent, Spark } from "@/features/workspace/contracts";

export type ProjectStatus = "draft" | "idle" | "running" | "blocked";
export type NodeStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting"
  | "done"
  | "failed"
  | "blocked";
export type InspectorTab = "project" | "node";

export type WorkflowNodeData = Record<string, unknown> & {
  label: string;
  app: string;
  description: string;
  status: NodeStatus;
  connector: string;
  sparkIds?: string[];
};

export type WorkflowNode = Node<WorkflowNodeData, "workflowNode">;
export type WorkflowEdge = Edge;

export type Project = {
  id: string;
  name: string;
  groupId: string;
  status: ProjectStatus;
  progress: number;
  owner: string;
  updatedAt: string;
  description: string;
  trigger: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  coreGraph: CoreGraph;
  sparks: Record<string, Spark>;
  eventLog: RuntimeEvent[];
};

export type ProjectGroup = {
  id: string;
  title: string;
  hint: string;
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

export type ProjectField = "name" | "owner" | "description" | "trigger";
