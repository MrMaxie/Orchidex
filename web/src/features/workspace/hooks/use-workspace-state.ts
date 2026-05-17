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
import type { ConnectionStrategy, RuntimeEvent, Spark } from "@/features/workspace/contracts";
import type {
  CatalogDiagnostic,
  CatalogNode,
  InspectorTab,
  Project,
  ProjectField,
  ProjectStatus,
  WorkflowNode,
  WorkflowNodeData,
} from "@/features/workspace/types";

export function useWorkspaceState(connection: ConnectionStrategy | null) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>("manual-start");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("node");
  const [isCatalogOpen, setCatalogOpen] = useState(false);
  const [nodeCatalog, setNodeCatalog] = useState<CatalogNode[]>(fallbackNodeCatalog);
  const [catalogDiagnostics, setCatalogDiagnostics] = useState<CatalogDiagnostic[]>([]);

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
          project.id === activeProjectId ? applyRuntimeEvent(project, event) : project,
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
          nodes: applyNodeChanges(changes, project.nodes),
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
          edges: applyEdgeChanges(changes, project.edges),
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
          edges: addEdge(
            {
              ...connectionParams,
              animated: true,
              label: "spark",
              style: { stroke: "var(--workflow-edge)", strokeWidth: 2 },
            },
            project.edges,
          ),
        };
        publishGraph(nextProject);
        return nextProject;
      });
    },
    [publishGraph, updateActiveProject],
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

    updateActiveProject((project) => {
      const nextProject = {
        ...project,
        nodes: project.nodes.map((node) =>
          node.id === selectedNodeId
            ? { ...node, data: { ...node.data, [field]: value } }
            : node,
        ),
      };
      publishGraph(nextProject);
      return nextProject;
    });
  };

  const addNodeFromCatalog = (catalogNode: CatalogNode) => {
    const nodeId = `${catalogNode.id.replace("/", "-")}-${Date.now().toString(36)}`;
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
        connector: catalogNode.id,
        description: catalogNode.description,
        status: "idle",
        sparkIds: [],
      },
    };

    updateActiveProject((project) => {
      const nextProject = {
        ...project,
        nodes: [...project.nodes, nextNode],
      };
      publishGraph(nextProject);
      return nextProject;
    });
    setSelectedNodeId(nodeId);
    setInspectorTab("node");
    setCatalogOpen(false);
  };

  const igniteFromSelectedNode = () => {
    const nodeId = selectedNodeId ?? activeProject.nodes[0]?.id;
    if (!nodeId) {
      return;
    }
    updateProjectStatus("running");
    void connection
      ?.igniteSpark({
        nodeId,
        payload: {
          source: "web",
          projectId: activeProject.id,
          startedAt: new Date().toISOString(),
        },
      })
      .catch(() => {
        updateProjectStatus("blocked");
      });
  };

  const extinguishSparks = () => {
    void connection?.extinguishSparks();
    updateProjectStatus("idle");
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

function applyRuntimeEvent(project: Project, event: RuntimeEvent): Project {
  const eventLog = [event, ...project.eventLog].slice(0, 24);

  switch (event.type) {
    case "graphUpdated":
      return {
        ...projectFromCoreGraph(event.graph),
        sparks: project.sparks,
        eventLog,
      };
    case "sparkIgnited":
      return {
        ...project,
        status: "running",
        sparks: {
          ...project.sparks,
          [event.spark.id]: event.spark,
        },
        nodes: markSpark(project.nodes, event.spark),
        eventLog,
      };
    case "sparkMoved": {
      const spark = project.sparks[event.sparkId];
      const nextSpark = spark
        ? { ...spark, currentNodeId: event.toNodeId }
        : undefined;
      return {
        ...project,
        sparks: nextSpark
          ? { ...project.sparks, [event.sparkId]: nextSpark }
          : project.sparks,
        edges: project.edges.map((edge) => ({
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
        nodes: nextSpark ? markSpark(project.nodes, nextSpark) : project.nodes,
        eventLog,
      };
    }
    case "nodeStatusChanged":
      return {
        ...project,
        nodes: project.nodes.map((node) =>
          node.id === event.nodeId
            ? { ...node, data: { ...node.data, status: event.status } }
            : node,
        ),
        eventLog,
      };
    case "sparkBlocked":
      return {
        ...project,
        status: "blocked",
        sparks: setSparkStatus(project.sparks, event.sparkId, "blocked"),
        eventLog,
      };
    case "sparkExtinguished":
      return {
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "extinguished"),
        eventLog,
      };
    case "allSparksExtinguished":
      return {
        ...project,
        status: "idle",
        sparks: Object.fromEntries(
          Object.entries(project.sparks).map(([id, spark]) => [
            id,
            { ...spark, status: "extinguished" },
          ]),
        ),
        eventLog,
      };
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
