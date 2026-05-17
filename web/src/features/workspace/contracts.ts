export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export type CoreGraph = {
  id: string;
  name: string;
  nodes: CoreGraphNode[];
  edges: CoreGraphEdge[];
};

export type CoreProjectMetadata = {
  id: string;
  name: string;
  groupId: string;
  cwd: string;
  owner: string;
  updatedAt: string;
  description: string;
  trigger: string;
};

export type CoreWorkflowGraph = {
  id: string;
  projectId: string;
  name: string;
  graph: CoreGraph;
};

export type CoreGraphNode = {
  id: string;
  kind: string;
  label: string;
  position: { x: number; y: number };
  config: JsonValue;
};

export type CoreGraphEdge = {
  id: string;
  source: string;
  sourcePort: string;
  target: string;
  targetPort: string;
  label?: string | null;
};

export type CoreNodeCatalogEntry = {
  id: string;
  label: string;
  description: string;
  capabilities: string[];
  configSchema: Record<string, JsonValue>;
  inputSchema: Record<string, JsonValue>;
  outputSchema: Record<string, JsonValue>;
  inputPorts: CoreNodePortDefinition[];
  outputPorts: CoreNodePortDefinition[];
};

export type CoreNodePortDirection = "input" | "output";

export type CoreNodePortCardinality = "one" | "many";

export type CoreNodePortDefinition = {
  id: string;
  label: string;
  direction: CoreNodePortDirection;
  schemaHints: Record<string, JsonValue>;
  cardinality: CoreNodePortCardinality;
};

export type CoreNodeCatalogDiagnostic = {
  path: string;
  message: string;
  nodeId?: string | null;
};

export type CoreNodeCatalogResponse = {
  entries: CoreNodeCatalogEntry[];
  diagnostics: CoreNodeCatalogDiagnostic[];
};

export type SparkStatus = "active" | "blocked" | "completed" | "extinguished";

export type WorkflowActivityStatus = "draft" | "idle" | "running" | "blocked";

export type WorkflowActivitySummary = {
  status: WorkflowActivityStatus;
  progress: number;
  activeSparkCount: number;
  blockedSparkCount: number;
  completedSparkCount: number;
  extinguishedSparkCount: number;
};

export type WorkspaceNavigationState = {
  lastOpenedWorkflowId: string | null;
};

export type Spark = {
  id: string;
  currentNodeId: string;
  payload: JsonValue;
  status: SparkStatus;
};

export type RuntimeEvent =
  | { type: "graphUpdated"; graph: CoreGraph }
  | { type: "sparkIgnited"; spark: Spark }
  | {
      type: "sparkMoved";
      sparkId: string;
      fromNodeId: string;
      toNodeId: string;
      edgeId: string;
    }
  | { type: "nodeStatusChanged"; nodeId: string; status: CoreNodeStatus }
  | { type: "sparkBlocked"; sparkId: string; reason: string }
  | { type: "sparkWaiting"; sparkId: string; nodeId: string; reason: string; resolution: string }
  | { type: "sparkFailed"; sparkId: string; nodeId: string; reason: string }
  | { type: "sparkCompleted"; sparkId: string; nodeId: string; reason: string }
  | { type: "sparkExtinguished"; sparkId: string }
  | { type: "allSparksExtinguished" }
  | { type: "queueChanged"; nodeId: string; released: boolean }
  | { type: "manualGateChanged"; sparkId: string; nodeId: string; resolved: boolean }
  | { type: "diagnosticRecorded"; diagnostic: RuntimeDiagnostic }
  | { type: "log"; nodeId: string; message: string };

export type RunHistoryEntry = {
  sparkId: string;
  graphId: string;
  finalStatus: SparkStatus;
  lastNodeId: string;
  reason?: string | null;
};

export type RuntimeDiagnostic = {
  kind: string;
  message: string;
  graphId: string;
  sparkId?: string | null;
  nodeId?: string | null;
  context: Record<string, JsonValue>;
};

export type SparkTraceStep = {
  sparkId: string;
  nodeId: string;
  event: string;
  edgeId?: string | null;
  reason?: string | null;
};

export type CoreNodeStatus =
  | "idle"
  | "queued"
  | "running"
  | "waiting"
  | "done"
  | "failed"
  | "blocked";

export type IgniteSparkInput = {
  nodeId: string;
  payload?: JsonValue;
};

export type ConnectionStrategy = {
  getGraph: () => Promise<CoreGraph>;
  getNodeCatalog: () => Promise<CoreNodeCatalogResponse>;
  replaceGraph: (graph: CoreGraph) => Promise<CoreGraph>;
  igniteSpark: (input: IgniteSparkInput) => Promise<Spark>;
  extinguishSparks: () => Promise<number>;
  subscribe: (handler: (event: RuntimeEvent) => void) => () => void;
};
