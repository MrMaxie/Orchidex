import { IconFileCode } from "@tabler/icons-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { projectStatusMeta } from "@/features/workspace/config/status-meta";
import type { Project } from "@/features/workspace/types";

export function ProjectTreeFile({
  isActive,
  onSelect,
  project,
}: {
  isActive: boolean;
  onSelect: (projectId: string) => void;
  project: Project;
}) {
  const status = projectStatusMeta[project.activity.status];
  const StatusIcon = status.icon;

  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs outline-none",
        "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/40",
        isActive && "bg-muted text-foreground",
      )}
      onClick={() => onSelect(project.metadata.id)}
      type="button"
    >
      <IconFileCode
        aria-hidden
        className="shrink-0 text-muted-foreground group-hover:text-foreground"
        size={15}
        stroke={1.7}
      />
      <span className="min-w-0 flex-1 truncate">{project.metadata.name}</span>
      <span className="hidden shrink-0 font-mono text-[0.625rem] text-muted-foreground group-hover:inline">
        {project.workflow.nodes.length}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <StatusIcon
            aria-label={`Workflow status: ${status.label}`}
            className={cn("shrink-0", status.className)}
            size={13}
            stroke={1.8}
          />
        </TooltipTrigger>
        <TooltipContent side="right">
          {status.label} · {project.metadata.updatedAt}
        </TooltipContent>
      </Tooltip>
    </button>
  );
}
