import { Handle, Position, type NodeProps } from "@xyflow/react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { nodeStatusMeta } from "@/features/workspace/config/status-meta";
import type { WorkflowNode } from "@/features/workspace/types";

export function WorkflowCardNode({ data, selected }: NodeProps<WorkflowNode>) {
  const status = nodeStatusMeta[data.status];
  const StatusIcon = status.icon;

  return (
    <article
      className={cn(
        "w-60 rounded-lg border bg-card/95 p-3 text-card-foreground shadow-xl shadow-black/30 backdrop-blur",
        "transition-colors",
        selected
          ? "border-primary ring-2 ring-ring/40"
          : "border-border hover:border-primary/60",
      )}
    >
      <Handle
        className="!size-3 !border-2 !border-background !bg-primary"
        position={Position.Left}
        type="target"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {data.app}
          </p>
          <h3 className="mt-1 truncate text-sm font-medium text-foreground">
            {data.label}
          </h3>
        </div>
        <Badge variant={status.badgeVariant}>
          <StatusIcon aria-hidden data-icon="inline-start" stroke={1.7} />
          {status.label}
        </Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-xs/relaxed text-muted-foreground">
        {data.description}
      </p>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[0.6875rem] text-muted-foreground">
        <span className="font-mono">{data.connector}</span>
        <StatusIcon
          aria-label={`Node status: ${status.label}`}
          className={cn(status.className)}
          size={14}
          stroke={1.7}
        />
      </div>
      <Handle
        className="!size-3 !border-2 !border-background !bg-primary"
        position={Position.Right}
        type="source"
      />
    </article>
  );
}
