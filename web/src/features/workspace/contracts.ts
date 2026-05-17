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
  | { type: "sparkExtinguished"; sparkId: string }
  | { type: "allSparksExtinguished" }
  | { type: "log"; nodeId: string; message: string };

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
