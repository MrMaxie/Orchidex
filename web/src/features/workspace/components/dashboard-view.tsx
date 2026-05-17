import { IconFileCode, IconFolder } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { projectStatusMeta } from "@/features/workspace/config/status-meta";
import type { Project } from "@/features/workspace/types";

export function DashboardView({
  onCreateProject,
  onCreateWorkflow,
  onWorkflowSelect,
  projects,
}: {
  onCreateProject: () => void;
  onCreateWorkflow: (projectId: string) => void;
  onWorkflowSelect: (workflowId: string) => void;
  projects: Project[];
}) {
  const workflowCount = projects.reduce(
    (count, project) => count + project.workflows.length,
    0,
  );

  return (
    <section className="flex min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-medium text-foreground">
            Dashboard
          </h2>
          <p className="text-xs text-muted-foreground">
            {projects.length} projects · {workflowCount} workflows
          </p>
        </div>
        <Button onClick={onCreateProject} type="button">
          New project
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="grid gap-3 p-4 xl:grid-cols-2">
          {projects.map((project) => (
            <ProjectSummary
              key={project.metadata.id}
              onCreateWorkflow={onCreateWorkflow}
              onWorkflowSelect={onWorkflowSelect}
              project={project}
            />
          ))}
        </div>
      </ScrollArea>
    </section>
  );
}

function ProjectSummary({
  onCreateWorkflow,
  onWorkflowSelect,
  project,
}: {
  onCreateWorkflow: (projectId: string) => void;
  onWorkflowSelect: (workflowId: string) => void;
  project: Project;
}) {
  const status = projectStatusMeta[project.activity.status];
  const StatusIcon = status.icon;

  return (
    <article className="rounded-md border border-border bg-card p-3 text-card-foreground">
      <header className="flex items-start gap-2">
        <IconFolder aria-hidden className="shrink-0 text-muted-foreground" size={16} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{project.metadata.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {project.metadata.cwd}
          </p>
        </div>
        <Badge variant={status.badgeVariant}>
          <StatusIcon data-icon="inline-start" stroke={1.7} />
          {status.label}
        </Badge>
      </header>
      <Separator className="my-3" />
      <div className="flex flex-col gap-1">
        {project.workflows.map((workflow) => (
          <button
            className="flex h-7 items-center gap-2 rounded-sm px-2 text-left text-xs text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            key={workflow.id}
            onClick={() => onWorkflowSelect(workflow.id)}
            type="button"
          >
            <IconFileCode aria-hidden className="shrink-0" size={14} />
            <span className="min-w-0 flex-1 truncate">{workflow.name}</span>
            <span className="font-mono text-[0.625rem]">
              {workflow.nodes.length}
            </span>
          </button>
        ))}
      </div>
      <Button
        className="mt-3 w-full"
        onClick={() => onCreateWorkflow(project.metadata.id)}
        size="sm"
        type="button"
        variant="outline"
      >
        New workflow
      </Button>
    </article>
  );
}
