import type { Edge, Node } from "@xyflow/react";

export type ProjectStatus = "draft" | "idle" | "running" | "blocked";
export type NodeStatus = "queued" | "running" | "waiting" | "done" | "failed";
export type InspectorTab = "project" | "node";

export type WorkflowNodeData = Record<string, unknown> & {
  label: string;
  app: string;
  description: string;
  status: NodeStatus;
  connector: string;
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
};

export type ProjectField = "name" | "owner" | "description" | "trigger";
