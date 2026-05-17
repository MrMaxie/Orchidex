import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";

import { Badge } from "@/components/ui/badge";
import { WorkflowCardNode } from "@/features/workspace/components/workflow-card-node";
import type { Project, WorkflowNode } from "@/features/workspace/types";

const nodeTypes = {
  workflowNode: WorkflowCardNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: { stroke: "var(--workflow-edge)", strokeWidth: 2 },
};

export function WorkflowCanvas({
  isRunning,
  onConnect,
  onEdgesChange,
  onNodesChange,
  onSelectNode,
  project,
  setSelectedNodeId,
  visibleNodes,
}: {
  isRunning: boolean;
  onConnect: (connection: Connection) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onSelectNode: () => void;
  project: Project;
  setSelectedNodeId: (nodeId: string | null) => void;
  visibleNodes: WorkflowNode[];
}) {
  return (
    <div className="min-h-0 p-3">
      <div className="relative h-full min-h-[34rem] overflow-hidden rounded-lg border border-border bg-background/80 shadow-2xl shadow-black/30">
        <ReactFlow
          attributionPosition="bottom-left"
          defaultEdgeOptions={defaultEdgeOptions}
          edges={project.workflow.edges}
          edgesReconnectable
          elementsSelectable
          fitView
          nodeTypes={nodeTypes}
          nodes={visibleNodes}
          nodesConnectable
          nodesDraggable
          onConnect={onConnect}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => {
            setSelectedNodeId(node.id);
            onSelectNode();
          }}
          onNodesChange={onNodesChange}
          onPaneClick={() => setSelectedNodeId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--workflow-grid)" gap={28} />
          <MiniMap
            className="!border !border-border !bg-popover"
            maskColor="color-mix(in oklch, var(--background) 74%, transparent)"
            nodeColor={(node) => {
              const workflowNode = node as WorkflowNode;

              if (workflowNode.data.status === "failed") {
                return "var(--workflow-status-failed)";
              }

              if (workflowNode.data.status === "running") {
                return "var(--workflow-status-running)";
              }

              return "var(--workflow-status-idle)";
            }}
            pannable
            zoomable
          />
          <Controls className="!border-border !bg-popover !text-foreground" />
        </ReactFlow>

        <div className="pointer-events-none absolute left-3 top-3 max-w-sm rounded-md border border-border bg-popover/90 p-3 shadow-lg shadow-black/20 backdrop-blur">
          <Badge variant={isRunning ? "default" : "outline"}>
            {isRunning ? "Live run preview" : "Workflow editor"}
          </Badge>
          <p className="mt-2 text-xs/relaxed text-muted-foreground">
            {isRunning
              ? "Sparks are live. You can still edit nodes and edges while runtime events update the canvas."
              : "Drag nodes, connect handles, or add a block from the node collection."}
          </p>
        </div>
      </div>
    </div>
  );
}
