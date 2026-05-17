import { useCallback, useMemo, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";

import { initialProjects } from "@/features/workspace/data/mock-projects";
import type {
  CatalogNode,
  InspectorTab,
  Project,
  ProjectField,
  ProjectStatus,
  WorkflowNode,
  WorkflowNodeData,
} from "@/features/workspace/types";

export function useWorkspaceState() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    "onboarding-enrich",
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("node");
  const [isCatalogOpen, setCatalogOpen] = useState(false);

  const activeProject = useMemo(
    () =>
      projects.find((project) => project.id === activeProjectId) ?? projects[0],
    [activeProjectId, projects],
  );

  const activeNode = useMemo(
    () =>
      activeProject.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [activeProject.nodes, selectedNodeId],
  );

  const visibleNodes = useMemo(
    () =>
      activeProject.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [activeProject.nodes, selectedNodeId],
  );

  const isRunning = activeProject.status === "running";

  const updateActiveProject = useCallback(
    (updater: (project: Project) => Project) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === activeProjectId ? updater(project) : project,
        ),
      );
    },
    [activeProjectId],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      if (isRunning) {
        return;
      }

      updateActiveProject((project) => ({
        ...project,
        nodes: applyNodeChanges(changes, project.nodes),
      }));
    },
    [isRunning, updateActiveProject],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isRunning) {
        return;
      }

      updateActiveProject((project) => ({
        ...project,
        edges: applyEdgeChanges(changes, project.edges),
      }));
    },
    [isRunning, updateActiveProject],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (isRunning) {
        return;
      }

      updateActiveProject((project) => ({
        ...project,
        edges: addEdge(
          {
            ...connection,
            animated: true,
            label: "next",
            style: { stroke: "var(--workflow-edge)", strokeWidth: 2 },
          },
          project.edges,
        ),
      }));
    },
    [isRunning, updateActiveProject],
  );

  const selectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setSelectedNodeId(null);
    setInspectorTab("project");
  };

  const updateProjectField = (field: ProjectField, value: string) => {
    updateActiveProject((project) => ({ ...project, [field]: value }));
  };

  const updateProjectStatus = (status: ProjectStatus) => {
    updateActiveProject((project) => ({
      ...project,
      status,
      progress:
        status === "running" ? Math.max(project.progress, 18) : project.progress,
    }));
  };

  const updateSelectedNode = (
    field: keyof WorkflowNodeData,
    value: string,
  ) => {
    if (!selectedNodeId) {
      return;
    }

    updateActiveProject((project) => ({
      ...project,
      nodes: project.nodes.map((node) =>
        node.id === selectedNodeId
          ? { ...node, data: { ...node.data, [field]: value } }
          : node,
      ),
    }));
  };

  const addNodeFromCatalog = (catalogNode: CatalogNode) => {
    const nodeId = `${catalogNode.id}-${Date.now().toString(36)}`;
    const nodeCount = activeProject.nodes.length;
    const nextNode: WorkflowNode = {
      id: nodeId,
      type: "workflowNode",
      position: {
        x: 120 + (nodeCount % 3) * 300,
        y: 120 + Math.floor(nodeCount / 3) * 190,
      },
      data: {
        label: catalogNode.label,
        app: catalogNode.app,
        connector: catalogNode.connector,
        description: catalogNode.description,
        status: "queued",
      },
    };

    updateActiveProject((project) => ({
      ...project,
      nodes: [...project.nodes, nextNode],
    }));
    setSelectedNodeId(nodeId);
    setInspectorTab("node");
    setCatalogOpen(false);
  };

  const toggleRunState = () => {
    updateProjectStatus(isRunning ? "idle" : "running");
  };

  return {
    activeNode,
    activeProject,
    activeProjectId,
    addNodeFromCatalog,
    inspectorTab,
    isCatalogOpen,
    isRunning,
    onConnect,
    onEdgesChange,
    onNodesChange,
    projects,
    selectProject,
    selectedNodeId,
    setCatalogOpen,
    setInspectorTab,
    setSelectedNodeId,
    toggleRunState,
    updateProjectField,
    updateProjectStatus,
    updateSelectedNode,
    visibleNodes,
  };
}
