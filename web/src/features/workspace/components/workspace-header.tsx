import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectStatusMeta } from "@/features/workspace/config/status-meta";
import type { Project, WorkflowGraphData } from "@/features/workspace/types";

export function WorkspaceHeader({
  activeWorkflow,
  onToggleRunState,
  project,
}: {
  activeWorkflow: WorkflowGraphData | null;
  onToggleRunState: () => void;
  project: Project | null;
}) {
  const status = projectStatusMeta[project?.activity.status ?? "idle"];
  const StatusIcon = status.icon;

  return (
    <header className="border-b border-border bg-background/70 px-4 py-3 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status.badgeVariant}>
              <StatusIcon data-icon="inline-start" stroke={1.7} />
              {status.label}
            </Badge>
          </div>
          <h2 className="mt-2 truncate text-xl font-medium text-foreground">
            {activeWorkflow?.name ?? "Dashboard"}
          </h2>
          <p className="mt-1 max-w-3xl text-xs/relaxed text-muted-foreground">
            {project
              ? `${project.metadata.name} · ${project.metadata.cwd}`
              : "Select or create a project workflow from the explorer."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={!activeWorkflow}
            onClick={() => onToggleRunState()}
            type="button"
            variant="outline"
          >
            {status.action}
          </Button>
        </div>
      </div>
    </header>
  );
}
