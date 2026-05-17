import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NodeInspector } from "@/features/workspace/components/inspector/node-inspector";
import { ProjectInspector } from "@/features/workspace/components/inspector/project-inspector";
import type {
  InspectorTab,
  Project,
  ProjectField,
  WorkflowNode,
  WorkflowNodeData,
} from "@/features/workspace/types";

export function InspectorPanel({
  activeNode,
  inspectorTab,
  onNodeChange,
  onProjectFieldChange,
  project,
  setInspectorTab,
}: {
  activeNode: WorkflowNode | null;
  inspectorTab: InspectorTab;
  onNodeChange: (field: keyof WorkflowNodeData, value: string) => void;
  onProjectFieldChange: (field: ProjectField, value: string) => void;
  project: Project;
  setInspectorTab: (tab: InspectorTab) => void;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-l border-border bg-sidebar text-sidebar-foreground">
      <Tabs
        className="flex min-h-0 flex-1 flex-col gap-0"
        onValueChange={(value) => setInspectorTab(value as InspectorTab)}
        value={inspectorTab}
      >
        <div className="flex h-11 items-center px-3">
          <TabsList className="w-full" variant="line">
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="node">Node</TabsTrigger>
          </TabsList>
        </div>
        <Separator />
        <ScrollArea className="min-h-0 flex-1">
          <TabsContent className="m-0 p-3" value="project">
            <ProjectInspector
              onFieldChange={onProjectFieldChange}
              project={project}
            />
          </TabsContent>
          <TabsContent className="m-0 p-3" value="node">
            <NodeInspector node={activeNode} onNodeChange={onNodeChange} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
