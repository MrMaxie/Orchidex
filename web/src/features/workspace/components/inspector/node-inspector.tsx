import { IconFileCode } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { nodeStatusMeta } from "@/features/workspace/config/status-meta";
import type {
  WorkflowNode,
  WorkflowNodeData,
} from "@/features/workspace/types";

export function NodeInspector({
  node,
  onNodeChange,
  onReleaseQueue,
  onResolveManualGate,
}: {
  node: WorkflowNode | null;
  onNodeChange: (field: keyof WorkflowNodeData, value: string) => void;
  onReleaseQueue: () => void;
  onResolveManualGate: () => void;
}) {
  if (!node) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-muted/20 p-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <IconFileCode aria-hidden size={15} stroke={1.7} />
          <p className="text-xs font-medium text-foreground">No node selected</p>
        </div>
        <p className="text-xs/relaxed text-muted-foreground">
          Select a block on the canvas to edit its label, connector, description,
          and execution status.
        </p>
      </div>
    );
  }

  const status = nodeStatusMeta[node.data.status];
  const StatusIcon = status.icon;
  const canReleaseQueue = node.data.connector === "std/accumulation";
  const canResolveManualGate = node.data.connector === "std/manual-accept";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-start gap-2">
        <StatusIcon
          aria-hidden
          className={status.className}
          size={16}
          stroke={1.7}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {node.data.label}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {node.data.app} · {node.data.connector}
          </p>
        </div>
        <Badge variant={status.badgeVariant}>{status.label}</Badge>
      </header>

      <Separator />

      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Configuration
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel>Node type</FieldLabel>
            <div className="rounded-md border border-border bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{node.data.app}</span>
              <span className="px-1.5">·</span>
              <span className="font-mono">{node.data.connector}</span>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="node-label">Label</FieldLabel>
            <Input
              id="node-label"
              onChange={(event) => onNodeChange("label", event.currentTarget.value)}
              value={node.data.label}
            />
          </Field>
          <Field>
            <FieldLabel>Status</FieldLabel>
            <Select
              onValueChange={(value) => onNodeChange("status", value)}
              value={node.data.status}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.entries(nodeStatusMeta).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </section>

      <FieldSeparator>Execution notes</FieldSeparator>

      {(canReleaseQueue || canResolveManualGate) && (
        <div className="flex flex-wrap gap-2">
          {canReleaseQueue && (
            <Button onClick={onReleaseQueue} size="sm" type="button" variant="outline">
              Release queue
            </Button>
          )}
          {canResolveManualGate && (
            <Button onClick={onResolveManualGate} size="sm" type="button" variant="outline">
              Resolve gate
            </Button>
          )}
        </div>
      )}

      <Field>
        <FieldLabel htmlFor="node-description">Description</FieldLabel>
        <Textarea
          id="node-description"
          onChange={(event) =>
            onNodeChange("description", event.currentTarget.value)
          }
          value={node.data.description}
        />
      </Field>
    </div>
  );
}
