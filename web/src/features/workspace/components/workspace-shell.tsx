import { NodeCatalogDialog } from "@/features/workspace/components/catalog/node-catalog-dialog";
import { DashboardView } from "@/features/workspace/components/dashboard-view";
import { InspectorPanel } from "@/features/workspace/components/inspector/inspector-panel";
import { ProjectTree } from "@/features/workspace/components/navigation/project-tree";
import { WorkspaceCreateDialog } from "@/features/workspace/components/workspace-create-dialog";
import { WorkflowCanvas } from "@/features/workspace/components/workflow-canvas";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import type { ConnectionStrategy } from "@/features/workspace/contracts";
import { useWorkspaceState } from "@/features/workspace/hooks/use-workspace-state";
import { useState } from "react";

export function WorkspaceShell({
  connection,
}: {
  connection: ConnectionStrategy | null;
}) {
  const workspace = useWorkspaceState(connection);
  const [createDialog, setCreateDialog] = useState<{
    mode: "project" | "workflow";
    projectId: string | null;
  } | null>(null);

  return (
    <main className="dark h-screen min-h-screen overflow-hidden bg-background text-foreground max-lg:h-auto max-lg:overflow-auto">
      <div className="grid h-full grid-cols-[16rem_minmax(0,1fr)_22rem] overflow-hidden bg-[radial-gradient(circle_at_top_left,_color-mix(in_oklch,var(--primary)_18%,transparent),_transparent_28rem),linear-gradient(135deg,_var(--background)_0%,_color-mix(in_oklch,var(--background)_88%,var(--muted))_100%)] max-xl:grid-cols-[15rem_minmax(0,1fr)_20rem] max-lg:h-auto max-lg:min-h-screen max-lg:grid-cols-1 max-lg:overflow-auto">
        <ProjectTree
          activeWorkflowId={workspace.activeWorkflowId}
          isDashboardActive={workspace.isDashboardActive}
          onCreateProject={() =>
            setCreateDialog({ mode: "project", projectId: null })
          }
          onCreateWorkflow={(projectId) =>
            setCreateDialog({ mode: "workflow", projectId })
          }
          onDashboardSelect={workspace.selectDashboard}
          onProjectSelect={workspace.selectProject}
          onWorkflowSelect={workspace.selectWorkflow}
          projects={workspace.projects}
          selectedProjectId={workspace.selectedProjectId}
        />

        <section className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
          <WorkspaceHeader
            activeWorkflow={workspace.activeWorkflow}
            isRunning={workspace.isRunning}
            onDuplicateWorkflow={workspace.duplicateWorkflow}
            onToggleRunState={workspace.toggleRunState}
            project={workspace.activeProject}
          />
          {workspace.activeWorkflow ? (
            <WorkflowCanvas
              isRunning={workspace.isRunning}
              onConnect={workspace.onConnect}
              onEdgesChange={workspace.onEdgesChange}
              onNodesChange={workspace.onNodesChange}
              onOpenCatalog={() => workspace.setCatalogOpen(true)}
              onSelectNode={() => workspace.setInspectorTab("node")}
              onSelectionClear={() => workspace.setSelectedNodeId(null)}
              setSelectedNodeId={workspace.setSelectedNodeId}
              visibleNodes={workspace.visibleNodes}
              workflow={workspace.activeWorkflow}
            />
          ) : (
            <DashboardView
              onCreateProject={() =>
                setCreateDialog({ mode: "project", projectId: null })
              }
              onCreateWorkflow={(projectId) =>
                setCreateDialog({ mode: "workflow", projectId })
              }
              onWorkflowSelect={workspace.selectWorkflow}
              projects={workspace.projects}
            />
          )}
        </section>

        {workspace.activeProject ? (
          <InspectorPanel
            activeNode={workspace.activeNode}
            activeWorkflow={workspace.activeWorkflow}
            inspectorTab={workspace.inspectorTab}
            onNodeChange={workspace.updateSelectedNode}
            onProjectFieldChange={workspace.updateProjectField}
            onReleaseQueue={workspace.releaseQueueForSelectedNode}
            onResolveManualGate={workspace.resolveManualGateForSelectedNode}
            project={workspace.activeProject}
            setInspectorTab={workspace.setInspectorTab}
          />
        ) : null}
      </div>

      <NodeCatalogDialog
        catalog={workspace.nodeCatalog}
        diagnostics={workspace.catalogDiagnostics}
        isOpen={workspace.isCatalogOpen}
        onAddNode={workspace.addNodeFromCatalog}
        onOpenChange={workspace.setCatalogOpen}
      />
      <WorkspaceCreateDialog
        mode={createDialog?.mode ?? "project"}
        onCreateProject={workspace.createProject}
        onCreateWorkflow={workspace.createWorkflow}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialog(null);
          }
        }}
        open={Boolean(createDialog)}
        projectId={createDialog?.projectId ?? workspace.selectedProjectId}
      />
    </main>
  );
}
