import { Badge } from "@/components/ui/badge";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { projectStatusMeta } from "@/features/workspace/config/status-meta";
import type {
  Project,
  ProjectField,
  WorkflowGraphData,
} from "@/features/workspace/types";

export function ProjectInspector({
  activeWorkflow,
  onFieldChange,
  project,
}: {
  activeWorkflow: WorkflowGraphData | null;
  onFieldChange: (field: ProjectField, value: string) => void;
  project: Project;
}) {
  const status = projectStatusMeta[project.activity.status];
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
          <p className="text-xs font-medium text-foreground">
            {project.metadata.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {project.metadata.owner} · {project.metadata.updatedAt}
          </p>
        </div>
        <Badge variant={status.badgeVariant}>{status.label}</Badge>
      </header>

      <Separator />

      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Overview
        </p>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="project-name">Name</FieldLabel>
            <Input
              id="project-name"
              onChange={(event) => onFieldChange("name", event.currentTarget.value)}
              value={project.metadata.name}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-cwd">Working directory</FieldLabel>
            <Input
              id="project-cwd"
              onChange={(event) => onFieldChange("cwd", event.currentTarget.value)}
              value={project.metadata.cwd}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-owner">Owner</FieldLabel>
            <Input
              id="project-owner"
              onChange={(event) =>
                onFieldChange("owner", event.currentTarget.value)
              }
              value={project.metadata.owner}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-trigger">Trigger</FieldLabel>
            <Input
              id="project-trigger"
              onChange={(event) =>
                onFieldChange("trigger", event.currentTarget.value)
              }
              value={project.metadata.trigger}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="project-description">Description</FieldLabel>
            <Textarea
              id="project-description"
              onChange={(event) =>
                onFieldChange("description", event.currentTarget.value)
              }
              value={project.metadata.description}
            />
          </Field>
        </FieldGroup>
      </section>

      <FieldSeparator>Graph</FieldSeparator>

      <section className="grid grid-cols-3 gap-2 text-xs">
        <Metric label="Workflows" value={project.workflows.length.toString()} />
        <Metric label="Nodes" value={(activeWorkflow?.nodes.length ?? 0).toString()} />
        <Metric label="Edges" value={(activeWorkflow?.edges.length ?? 0).toString()} />
        <Metric label="Ready" value={`${project.activity.progress}%`} />
      </section>

      {project.diagnostics[0] && (
        <>
          <FieldSeparator>Latest diagnostic</FieldSeparator>
          <section className="rounded-md border border-border bg-muted/30 p-2 text-xs">
            <p className="font-medium text-foreground">
              {project.diagnostics[0].kind}
            </p>
            <p className="mt-1 text-muted-foreground">
              {project.diagnostics[0].message}
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2 py-1.5">
      <p className="text-[0.625rem] text-muted-foreground">{label}</p>
      <p className="font-mono text-xs text-foreground">{value}</p>
    </div>
  );
}
