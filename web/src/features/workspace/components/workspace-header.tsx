import { IconPlus } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { projectStatusMeta } from "@/features/workspace/config/status-meta";
import type { Project } from "@/features/workspace/types";

export function WorkspaceHeader({
  isRunning,
  onOpenCatalog,
  onToggleRunState,
  project,
}: {
  isRunning: boolean;
  onOpenCatalog: () => void;
  onToggleRunState: () => void;
  project: Project;
}) {
  const status = projectStatusMeta[project.status];
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
            <Badge variant="outline">
              {isRunning ? "Preview mode" : "Editor mode"}
            </Badge>
          </div>
          <h2 className="mt-2 truncate text-xl font-medium text-foreground">
            {project.name}
          </h2>
          <p className="mt-1 max-w-3xl text-xs/relaxed text-muted-foreground">
            {project.description}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => onToggleRunState()} type="button" variant="outline">
            {status.action}
          </Button>
          <Button onClick={onOpenCatalog} type="button">
            <IconPlus data-icon="inline-start" stroke={1.7} />
            Add node
          </Button>
        </div>
      </div>
    </header>
  );
}
