import { IconFolders } from "@tabler/icons-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ProjectTreeFolder } from "@/features/workspace/components/navigation/project-tree-folder";
import type { Project, ProjectGroup } from "@/features/workspace/types";

export function ProjectTree({
  activeProjectId,
  groups,
  onProjectSelect,
  projects,
}: {
  activeProjectId: string;
  groups: ProjectGroup[];
  onProjectSelect: (projectId: string) => void;
  projects: Project[];
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-11 items-center gap-2 px-3">
        <IconFolders aria-hidden size={16} stroke={1.7} />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-[0.14em]">
            Explorer
          </p>
          <p className="truncate text-[0.625rem] text-muted-foreground">
            Projects and workflows
          </p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <nav aria-label="Project tree" className="flex flex-col gap-1 p-2">
          {groups.map((group) => (
            <ProjectTreeFolder
              activeProjectId={activeProjectId}
              group={group}
              key={group.id}
              onProjectSelect={onProjectSelect}
              projects={projects.filter((project) => project.metadata.groupId === group.id)}
            />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
