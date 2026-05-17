import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";

import {
  catalogNodeFromCoreEntry,
  fallbackNodeCatalog,
  initialProjects,
  projectFromCoreGraph,
  workflowToCoreGraph,
} from "@/features/workspace/data/mock-projects";
import type {
  ConnectionStrategy,
  RuntimeEvent,
  Spark,
  WorkspaceNavigationState,
} from "@/features/workspace/contracts";
import type {
  CatalogDiagnostic,
  CatalogNode,
  InspectorTab,
  Project,
  ProjectField,
  WorkflowNode,
  WorkflowNodeData,
} from "@/features/workspace/types";

const workspaceNavigationStorageKey = "orchidex.workspace.navigation";

export function useWorkspaceState(connection: ConnectionStrategy | null) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [navigationState, setNavigationState] =
    useState<WorkspaceNavigationState>(readWorkspaceNavigationState);
  const [activeProjectId, setActiveProjectId] = useState(
    navigationState.lastOpenedWorkflowId ?? initialProjects[0].metadata.id,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("manual-start");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("node");
  const [isCatalogOpen, setCatalogOpen] = useState(false);
  const [nodeCatalog, setNodeCatalog] = useState<CatalogNode[]>(fallbackNodeCatalog);
  const [catalogDiagnostics, setCatalogDiagnostics] = useState<CatalogDiagnostic[]>([]);

  const activeProject = useMemo(
    () =>
      projects.find((project) => project.metadata.id === activeProjectId) ?? projects[0],
    [activeProjectId, projects],
  );

  const activeNode = useMemo(
    () =>
      activeProject.workflow.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [activeProject.workflow.nodes, selectedNodeId],
  );

  const visibleNodes = useMemo(
    () =>
      activeProject.workflow.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [activeProject.workflow.nodes, selectedNodeId],
  );

  const isRunning = activeProject.activity.status === "running";

  const updateActiveProject = useCallback(
    (updater: (project: Project) => Project) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.metadata.id === activeProjectId ? updater(project) : project,
        ),
      );
    },
    [activeProjectId],
  );

  useEffect(() => {
    if (!connection) {
      return;
    }

    let active = true;
    connection
      .getGraph()
      .then((graph) => {
        if (!active) {
          return;
        }
        setProjects([projectFromCoreGraph(graph)]);
        setActiveProjectId(graph.id);
      })
      .catch(() => {
        setProjects(initialProjects);
      });

    connection
      .getNodeCatalog()
      .then((catalog) => {
        if (!active) {
          return;
        }
        setNodeCatalog(catalog.entries.map(catalogNodeFromCoreEntry));
        setCatalogDiagnostics(catalog.diagnostics);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setNodeCatalog(fallbackNodeCatalog);
        setCatalogDiagnostics([]);
      });

    const unsubscribe = connection.subscribe((event) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.metadata.id === activeProjectId ? applyRuntimeEvent(project, event) : project,
        ),
      );
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [activeProjectId, connection]);

  const publishGraph = useCallback(
    (project: Project) => {
      void connection?.replaceGraph(workflowToCoreGraph(project)).catch(() => {
        // The web shell can run before core is started; keep local edits responsive.
      });
    },
    [connection],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      updateActiveProject((project) => {
        const nextProject = {
          ...project,
          workflow: {
            ...project.workflow,
            nodes: applyNodeChanges(changes, project.workflow.nodes),
          },
        };
        publishGraph(nextProject);
        return nextProject;
      });
    },
    [publishGraph, updateActiveProject],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      updateActiveProject((project) => {
        const nextProject = {
          ...project,
          workflow: {
            ...project.workflow,
            edges: applyEdgeChanges(changes, project.workflow.edges),
          },
        };
        publishGraph(nextProject);
        return nextProject;
      });
    },
    [publishGraph, updateActiveProject],
  );

  const onConnect = useCallback(
    (connectionParams: Connection) => {
      updateActiveProject((project) => {
        const nextProject = {
          ...project,
          workflow: {
            ...project.workflow,
            edges: addEdge(
              {
                ...connectionParams,
                animated: true,
                sourceHandle: connectionParams.sourceHandle ?? "out",
                targetHandle: connectionParams.targetHandle ?? "in",
                data: {
                  routingLabel: null,
                },
                style: { stroke: "var(--workflow-edge)", strokeWidth: 2 },
              },
              project.workflow.edges,
            ),
          },
        };
        publishGraph(nextProject);
        return nextProject;
      });
    },
    [publishGraph, updateActiveProject],
  );

  const selectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    writeWorkspaceNavigationState({ lastOpenedWorkflowId: projectId });
    setNavigationState({ lastOpenedWorkflowId: projectId });
    setSelectedNodeId(null);
    setInspectorTab("project");
  };

  const updateProjectField = (field: ProjectField, value: string) => {
    updateActiveProject((project) => ({
      ...project,
      metadata: { ...project.metadata, [field]: value },
      workflow:
        field === "name"
          ? { ...project.workflow, name: value }
          : project.workflow,
    }));
  };

  const updateSelectedNode = (
    field: keyof WorkflowNodeData,
    value: string,
  ) => {
    if (!selectedNodeId) {
      return;
    }

    updateActiveProject((project) => {
      const nextProject = {
        ...project,
        workflow: {
          ...project.workflow,
          nodes: project.workflow.nodes.map((node) =>
            node.id === selectedNodeId
              ? { ...node, data: { ...node.data, [field]: value } }
              : node,
          ),
        },
      };
      publishGraph(nextProject);
      return nextProject;
    });
  };

  const addNodeFromCatalog = (catalogNode: CatalogNode) => {
    const nodeId = `${catalogNode.id.replace("/", "-")}-${Date.now().toString(36)}`;
    const nodeCount = activeProject.workflow.nodes.length;
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
        connector: catalogNode.id,
        description: catalogNode.description,
        status: "idle",
        sparkIds: [],
      },
    };

    updateActiveProject((project) => {
      const nextProject = {
        ...project,
        workflow: {
          ...project.workflow,
          nodes: [...project.workflow.nodes, nextNode],
        },
      };
      publishGraph(nextProject);
      return nextProject;
    });
    setSelectedNodeId(nodeId);
    setInspectorTab("node");
    setCatalogOpen(false);
  };

  const igniteFromSelectedNode = () => {
    const nodeId = selectedNodeId ?? activeProject.workflow.nodes[0]?.id;
    if (!nodeId) {
      return;
    }
    void connection
      ?.igniteSpark({
        nodeId,
        payload: {
          source: "web",
          projectId: activeProject.metadata.id,
          cwd: activeProject.metadata.cwd,
          startedAt: new Date().toISOString(),
        },
      })
      .catch(() => undefined);
  };

  const extinguishSparks = () => {
    void connection?.extinguishSparks();
  };

  const toggleRunState = () => {
    if (isRunning) {
      extinguishSparks();
    } else {
      igniteFromSelectedNode();
    }
  };

  return {
    activeNode,
    activeProject,
    activeProjectId,
    addNodeFromCatalog,
    catalogDiagnostics,
    inspectorTab,
    isCatalogOpen,
    isRunning,
    nodeCatalog,
    navigationState,
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
    updateSelectedNode,
    visibleNodes,
  };
}

function applyRuntimeEvent(project: Project, event: RuntimeEvent): Project {
  const eventLog = [event, ...project.eventLog].slice(0, 24);

  switch (event.type) {
    case "graphUpdated":
      return withDerivedActivity({
        ...projectFromCoreGraph(event.graph),
        metadata: {
          ...project.metadata,
          name: event.graph.name,
        },
        sparks: project.sparks,
        eventLog,
      });
    case "sparkIgnited":
      return withDerivedActivity({
        ...project,
        sparks: {
          ...project.sparks,
          [event.spark.id]: event.spark,
        },
        workflow: {
          ...project.workflow,
          nodes: markSpark(project.workflow.nodes, event.spark),
        },
        eventLog,
      });
    case "sparkMoved": {
      const spark = project.sparks[event.sparkId];
      const nextSpark = spark
        ? { ...spark, currentNodeId: event.toNodeId }
        : undefined;
      return withDerivedActivity({
        ...project,
        sparks: nextSpark
          ? { ...project.sparks, [event.sparkId]: nextSpark }
          : project.sparks,
        workflow: {
          ...project.workflow,
          edges: project.workflow.edges.map((edge) => ({
            ...edge,
            animated: edge.id === event.edgeId || edge.animated,
            style: {
              stroke:
                edge.id === event.edgeId
                  ? "var(--workflow-status-running)"
                  : "var(--workflow-edge)",
              strokeWidth: edge.id === event.edgeId ? 3 : 2,
            },
          })),
          nodes: nextSpark
            ? markSpark(project.workflow.nodes, nextSpark)
            : project.workflow.nodes,
        },
        eventLog,
      });
    }
    case "nodeStatusChanged":
      return {
        ...project,
        workflow: {
          ...project.workflow,
          nodes: project.workflow.nodes.map((node) =>
            node.id === event.nodeId
              ? { ...node, data: { ...node.data, status: event.status } }
              : node,
          ),
        },
        eventLog,
      };
    case "sparkBlocked":
      return withDerivedActivity({
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "blocked"),
        eventLog,
      });
    case "sparkExtinguished":
      return withDerivedActivity({
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "extinguished"),
        eventLog,
      });
    case "allSparksExtinguished":
      return withDerivedActivity({
        ...project,
        sparks: Object.fromEntries(
          Object.entries(project.sparks).map(([id, spark]) => [
            id,
            { ...spark, status: "extinguished" },
          ]),
        ),
        eventLog,
      });
    case "log":
      return { ...project, eventLog };
  }
}

function markSpark(nodes: WorkflowNode[], spark: Spark): WorkflowNode[] {
  return nodes.map((node) => {
    const sparkIds = new Set(node.data.sparkIds ?? []);
    sparkIds.delete(spark.id);
    if (node.id === spark.currentNodeId && spark.status === "active") {
      sparkIds.add(spark.id);
    }
    return {
      ...node,
      data: {
        ...node.data,
        sparkIds: Array.from(sparkIds),
      },
    };
  });
}

function setSparkStatus(
  sparks: Record<string, Spark>,
  sparkId: string,
  status: Spark["status"],
): Record<string, Spark> {
  const spark = sparks[sparkId];
  if (!spark) {
    return sparks;
  }
  return {
    ...sparks,
    [sparkId]: { ...spark, status },
  };
}

function withDerivedActivity(project: Project): Project {
  return {
    ...project,
    activity: deriveWorkflowActivity(project.sparks),
  };
}

function deriveWorkflowActivity(sparks: Record<string, Spark>): Project["activity"] {
  const sparkList = Object.values(sparks);
  const activeSparkCount = sparkList.filter((spark) => spark.status === "active").length;
  const blockedSparkCount = sparkList.filter((spark) => spark.status === "blocked").length;
  const completedSparkCount = sparkList.filter((spark) => spark.status === "completed").length;
  const extinguishedSparkCount = sparkList.filter((spark) => spark.status === "extinguished").length;
  const status =
    blockedSparkCount > 0
      ? "blocked"
      : activeSparkCount > 0
        ? "running"
        : "idle";

  return {
    status,
    progress:
      sparkList.length === 0
        ? 0
        : Math.round(((completedSparkCount + extinguishedSparkCount) / sparkList.length) * 100),
    activeSparkCount,
    blockedSparkCount,
    completedSparkCount,
    extinguishedSparkCount,
  };
}

function readWorkspaceNavigationState(): WorkspaceNavigationState {
  try {
    const rawValue = window.localStorage.getItem(workspaceNavigationStorageKey);
    if (!rawValue) {
      return { lastOpenedWorkflowId: null };
    }
    const parsedValue = JSON.parse(rawValue) as Partial<WorkspaceNavigationState>;
    return {
      lastOpenedWorkflowId:
        typeof parsedValue.lastOpenedWorkflowId === "string"
          ? parsedValue.lastOpenedWorkflowId
          : null,
    };
  } catch {
    return { lastOpenedWorkflowId: null };
  }
}

function writeWorkspaceNavigationState(state: WorkspaceNavigationState) {
  window.localStorage.setItem(workspaceNavigationStorageKey, JSON.stringify(state));
}
