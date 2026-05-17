import { nodeCatalog, projectGroups } from "@/features/workspace/data/mock-projects";
import { NodeCatalogDialog } from "@/features/workspace/components/catalog/node-catalog-dialog";
import { InspectorPanel } from "@/features/workspace/components/inspector/inspector-panel";
import { ProjectTree } from "@/features/workspace/components/navigation/project-tree";
import { WorkflowCanvas } from "@/features/workspace/components/workflow-canvas";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import { useWorkspaceState } from "@/features/workspace/hooks/use-workspace-state";

export function WorkspaceShell() {
  const workspace = useWorkspaceState();

  return (
    <main className="dark h-screen min-h-screen overflow-hidden bg-background text-foreground max-lg:h-auto max-lg:overflow-auto">
      <div className="grid h-full grid-cols-[16rem_minmax(0,1fr)_22rem] overflow-hidden bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklch,var(--primary)_18%,transparent),_transparent_28rem),linear-gradient(135deg,_var(--background)_0%,_color-mix(in_oklch,var(--background)_88%,var(--muted))_100%)] max-xl:grid-cols-[15rem_minmax(0,1fr)_20rem] max-lg:h-auto max-lg:min-h-screen max-lg:grid-cols-1 max-lg:overflow-auto">
        <ProjectTree
          activeProjectId={workspace.activeProjectId}
          groups={projectGroups}
          onProjectSelect={workspace.selectProject}
          projects={workspace.projects}
        />

        <section className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
          <WorkspaceHeader
            isRunning={workspace.isRunning}
            onOpenCatalog={() => workspace.setCatalogOpen(true)}
            onToggleRunState={workspace.toggleRunState}
            project={workspace.activeProject}
          />
          <WorkflowCanvas
            isRunning={workspace.isRunning}
            onConnect={workspace.onConnect}
            onEdgesChange={workspace.onEdgesChange}
            onNodesChange={workspace.onNodesChange}
            onSelectNode={() => workspace.setInspectorTab("node")}
            project={workspace.activeProject}
            setSelectedNodeId={workspace.setSelectedNodeId}
            visibleNodes={workspace.visibleNodes}
          />
        </section>

        <InspectorPanel
          activeNode={workspace.activeNode}
          inspectorTab={workspace.inspectorTab}
          onNodeChange={workspace.updateSelectedNode}
          onProjectFieldChange={workspace.updateProjectField}
          onProjectStatusChange={workspace.updateProjectStatus}
          project={workspace.activeProject}
          setInspectorTab={workspace.setInspectorTab}
        />
      </div>

      <NodeCatalogDialog
        catalog={nodeCatalog}
        isOpen={workspace.isCatalogOpen}
        onAddNode={workspace.addNodeFromCatalog}
        onOpenChange={workspace.setCatalogOpen}
      />
    </main>
  );
}
