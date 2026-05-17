import {
  IconCopy,
  IconFileCode,
  IconFolder,
  IconPlus,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { projectStatusMeta } from "@/features/workspace/config/status-meta";
import type { Project } from "@/features/workspace/types";

export function ProjectTreeFile({
  activeWorkflowId,
  isActive,
  onCreateWorkflow,
  onDuplicateWorkflow,
  onProjectSelect,
  onWorkflowSelect,
  project,
}: {
  activeWorkflowId: string | null;
  isActive: boolean;
  onCreateWorkflow: (projectId: string) => void;
  onDuplicateWorkflow: (workflowId: string) => void;
  onProjectSelect: (projectId: string) => void;
  onWorkflowSelect: (workflowId: string) => void;
  project: Project;
}) {
  const status = projectStatusMeta[project.activity.status];
  const StatusIcon = status.icon;

  return (
    <div className="flex flex-col gap-px">
      <button
        aria-current={isActive && !activeWorkflowId ? "page" : undefined}
        className={cn(
          "group flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs outline-none",
          "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          "focus-visible:ring-2 focus-visible:ring-ring/40",
          isActive && !activeWorkflowId && "bg-muted text-foreground",
        )}
        onClick={() => onProjectSelect(project.metadata.id)}
        type="button"
      >
        <IconFolder
          aria-hidden
          className="shrink-0 text-muted-foreground group-hover:text-foreground"
          size={15}
          stroke={1.7}
        />
        <span className="min-w-0 flex-1 truncate">{project.metadata.name}</span>
        <span className="font-mono text-[0.625rem] text-muted-foreground">
          {project.workflows.length}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <StatusIcon
              aria-label={`Project status: ${status.label}`}
              className={cn("shrink-0", status.className)}
              size={13}
              stroke={1.8}
            />
          </TooltipTrigger>
          <TooltipContent side="right">
            {status.label} · {project.metadata.cwd}
          </TooltipContent>
        </Tooltip>
      </button>

      <div className="flex flex-col gap-px pl-4">
        {project.workflows.map((workflow) => (
          <div className="group/workflow flex items-center gap-1" key={workflow.id}>
            <button
              aria-current={workflow.id === activeWorkflowId ? "page" : undefined}
              className={cn(
                "group flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-sm px-2 text-left text-xs outline-none",
                "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                "focus-visible:ring-2 focus-visible:ring-ring/40",
                workflow.id === activeWorkflowId && "bg-muted text-foreground",
              )}
              onClick={() => onWorkflowSelect(workflow.id)}
              type="button"
            >
              <IconFileCode
                aria-hidden
                className="shrink-0 text-muted-foreground group-hover:text-foreground"
                size={15}
                stroke={1.7}
              />
              <span className="min-w-0 flex-1 truncate">{workflow.name}</span>
              <span className="hidden shrink-0 font-mono text-[0.625rem] text-muted-foreground group-hover:inline">
                {workflow.nodes.length}
              </span>
            </button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={`Duplicate ${workflow.name}`}
                  className="opacity-0 transition-opacity group-hover/workflow:opacity-100 focus-visible:opacity-100"
                  onClick={() => onDuplicateWorkflow(workflow.id)}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <IconCopy aria-hidden stroke={1.7} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Duplicate workflow</TooltipContent>
            </Tooltip>
          </div>
        ))}
        <Button
          className="justify-start"
          onClick={() => onCreateWorkflow(project.metadata.id)}
          size="xs"
          type="button"
          variant="ghost"
        >
          <IconPlus aria-hidden data-icon="inline-start" stroke={1.7} />
          New workflow
        </Button>
      </div>
    </div>
  );
}
