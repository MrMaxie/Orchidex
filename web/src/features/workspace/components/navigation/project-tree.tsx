import { IconDashboard, IconFolders, IconPlus } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ProjectTreeFolder } from "@/features/workspace/components/navigation/project-tree-folder";
import type { Project, ProjectGroup } from "@/features/workspace/types";

export function ProjectTree({
  activeWorkflowId,
  groups,
  isDashboardActive,
  onCreateProject,
  onCreateWorkflow,
  onDashboardSelect,
  onProjectSelect,
  onWorkflowSelect,
  projects,
  selectedProjectId,
}: {
  activeWorkflowId: string | null;
  groups: ProjectGroup[];
  isDashboardActive: boolean;
  onCreateProject: () => void;
  onCreateWorkflow: (projectId: string) => void;
  onDashboardSelect: () => void;
  onProjectSelect: (projectId: string) => void;
  onWorkflowSelect: (workflowId: string) => void;
  projects: Project[];
  selectedProjectId: string | null;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-11 items-center gap-2 px-3">
        <IconFolders aria-hidden size={16} stroke={1.7} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-[0.14em]">
            Explorer
          </p>
          <p className="truncate text-[0.625rem] text-muted-foreground">
            Projects and workflows
          </p>
        </div>
        <Button
          aria-label="Create project"
          onClick={onCreateProject}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <IconPlus aria-hidden data-icon="inline-start" stroke={1.7} />
        </Button>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Project tree" className="flex flex-col gap-1 p-2">
          <button
            aria-current={isDashboardActive ? "page" : undefined}
            className={cn(
              "flex h-8 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs outline-none",
              "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "focus-visible:ring-2 focus-visible:ring-ring/40",
              isDashboardActive && "bg-muted text-foreground",
            )}
            onClick={onDashboardSelect}
            type="button"
          >
            <IconDashboard aria-hidden className="shrink-0" size={15} stroke={1.7} />
            <span className="min-w-0 flex-1 truncate">Dashboard</span>
          </button>
          {groups.map((group) => (
            <ProjectTreeFolder
              activeWorkflowId={activeWorkflowId}
              group={group}
              key={group.id}
              onCreateWorkflow={onCreateWorkflow}
              onProjectSelect={onProjectSelect}
              onWorkflowSelect={onWorkflowSelect}
              projects={projects.filter((project) => project.metadata.groupId === group.id)}
              selectedProjectId={selectedProjectId}
            />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
