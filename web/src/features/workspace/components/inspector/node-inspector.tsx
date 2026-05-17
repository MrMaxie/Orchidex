import { IconFileCode } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
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
}: {
  node: WorkflowNode | null;
  onNodeChange: (field: keyof WorkflowNodeData, value: string) => void;
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
            <FieldLabel htmlFor="node-label">Label</FieldLabel>
            <Input
              id="node-label"
              onChange={(event) => onNodeChange("label", event.currentTarget.value)}
              value={node.data.label}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="node-app">App</FieldLabel>
            <Input
              id="node-app"
              onChange={(event) => onNodeChange("app", event.currentTarget.value)}
              value={node.data.app}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="node-connector">Connector</FieldLabel>
            <Input
              id="node-connector"
              onChange={(event) =>
                onNodeChange("connector", event.currentTarget.value)
              }
              value={node.data.connector}
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
