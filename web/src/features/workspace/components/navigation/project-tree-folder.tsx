import { useState, type KeyboardEvent } from "react";
import {
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
} from "@tabler/icons-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ProjectTreeFile } from "@/features/workspace/components/navigation/project-tree-file";
import type { Project, ProjectGroup } from "@/features/workspace/types";

export function ProjectTreeFolder({
  activeProjectId,
  group,
  onProjectSelect,
  projects,
}: {
  activeProjectId: string;
  group: ProjectGroup;
  onProjectSelect: (projectId: string) => void;
  projects: Project[];
}) {
  const [isOpen, setIsOpen] = useState(true);
  const FolderIcon = isOpen ? IconFolderOpen : IconFolder;

  const handleFolderKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      setIsOpen(true);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CollapsibleTrigger asChild>
            <button
              aria-label={`${group.title} folder`}
              className="flex h-7 w-full items-center gap-1.5 rounded-sm px-2 text-left text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              onKeyDown={handleFolderKeyDown}
              type="button"
            >
              <IconChevronRight
                aria-hidden
                className={cn("shrink-0 transition-transform", isOpen && "rotate-90")}
                size={14}
                stroke={1.7}
              />
              <FolderIcon aria-hidden className="shrink-0" size={15} stroke={1.7} />
              <span className="min-w-0 flex-1 truncate">{group.title}</span>
              <span className="font-mono text-[0.625rem]">{projects.length}</span>
            </button>
          </CollapsibleTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">{group.hint}</TooltipContent>
      </Tooltip>
      <CollapsibleContent>
        <div className="flex flex-col gap-px pl-4">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectTreeFile
                isActive={project.metadata.id === activeProjectId}
                key={project.metadata.id}
                onSelect={onProjectSelect}
                project={project}
              />
            ))
          ) : (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              No workflows
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
