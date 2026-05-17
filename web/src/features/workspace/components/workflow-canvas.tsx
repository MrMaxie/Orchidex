import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { IconFocusCentered, IconPointer, IconPlus } from "@tabler/icons-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkflowCardNode } from "@/features/workspace/components/workflow-card-node";
import type { WorkflowGraphData, WorkflowNode } from "@/features/workspace/types";

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
  onOpenCatalog,
  onSelectNode,
  onSelectionClear,
  setSelectedNodeId,
  visibleNodes,
  workflow,
}: {
  isRunning: boolean;
  onConnect: (connection: Connection) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onOpenCatalog: () => void;
  onSelectNode: () => void;
  onSelectionClear: () => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  visibleNodes: WorkflowNode[];
  workflow: WorkflowGraphData;
}) {
  return (
    <div className="min-h-0">
      <div className="relative h-full min-h-[34rem] overflow-hidden border-border bg-background/80 shadow-2xl shadow-black/30">
        <ReactFlow
          attributionPosition="bottom-left"
          defaultEdgeOptions={defaultEdgeOptions}
          edges={workflow.edges}
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
          onPaneClick={onSelectionClear}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--workflow-grid)" gap={28} />
          <MiniMap
            className="!h-24 !w-36 !border !border-border !bg-popover"
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
            style={{ height: 96, width: 144 }}
            zoomable
          />
          <Controls className="!border-border !bg-popover !text-foreground" />
          <Panel position="top-left">
            <div className="flex items-center gap-2 rounded-md border border-border bg-popover/95 p-1 shadow-lg">
              <Badge variant={isRunning ? "default" : "outline"}>
                {isRunning ? "Live sparks" : "Editable graph"}
              </Badge>
              <CanvasIconButton
                label="Add node"
                onClick={onOpenCatalog}
                icon={<IconPlus aria-hidden data-icon="inline-start" stroke={1.7} />}
              />
              <CanvasFitButton />
              <CanvasIconButton
                label="Clear selection"
                onClick={onSelectionClear}
                icon={<IconPointer aria-hidden data-icon="inline-start" stroke={1.7} />}
              />
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

function CanvasFitButton() {
  const { fitView } = useReactFlow();

  return (
    <CanvasIconButton
      icon={<IconFocusCentered aria-hidden data-icon="inline-start" stroke={1.7} />}
      label="Fit view"
      onClick={() => fitView({ duration: 180, padding: 0.2 })}
    />
  );
}

function CanvasIconButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          onClick={onClick}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
