import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  createEmptyWorkflow,
  fallbackNodeCatalog,
  initialProjects,
  projectFromCoreGraph,
  workflowFromCoreGraph,
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
  WorkflowGraphData,
  WorkflowNode,
  WorkflowNodeData,
} from "@/features/workspace/types";

const workspaceNavigationStorageKey = "orchidex.workspace.navigation";

export function useWorkspaceState(connection: ConnectionStrategy | null) {
  const initialWorkflowId = resolveRestoredWorkflowId(
    initialProjects,
    readWorkspaceNavigationState().lastOpenedWorkflowId,
  );
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [navigationState, setNavigationState] =
    useState<WorkspaceNavigationState>(() => ({
      lastOpenedWorkflowId: initialWorkflowId,
    }));
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(
    initialWorkflowId,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    findProjectForWorkflow(initialProjects, initialWorkflowId)?.metadata.id ??
      initialProjects[0]?.metadata.id ??
      null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    initialWorkflowId ? "manual-start" : null,
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("project");
  const [isCatalogOpen, setCatalogOpen] = useState(false);
  const [nodeCatalog, setNodeCatalog] = useState<CatalogNode[]>(fallbackNodeCatalog);
  const [catalogDiagnostics, setCatalogDiagnostics] = useState<CatalogDiagnostic[]>([]);

  const activeProject = useMemo(
    () =>
      findProjectForWorkflow(projects, activeWorkflowId) ??
      projects.find((project) => project.metadata.id === selectedProjectId) ??
      projects[0] ??
      null,
    [activeWorkflowId, projects, selectedProjectId],
  );

  const activeWorkflow = useMemo(
    () => findWorkflow(projects, activeWorkflowId),
    [activeWorkflowId, projects],
  );

  const activeNode = useMemo(
    () =>
      activeWorkflow?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [activeWorkflow?.nodes, selectedNodeId],
  );

  const visibleNodes = useMemo(
    () =>
      activeWorkflow?.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })) ?? [],
    [activeWorkflow?.nodes, selectedNodeId],
  );

  const isRunning = activeProject?.activity.status === "running";
  const activeProjectId = activeProject?.metadata.id ?? null;
  const activeProjectIdRef = useRef(activeProjectId);
  const activeWorkflowIdRef = useRef(activeWorkflowId);

  useEffect(() => {
    activeProjectIdRef.current = activeProjectId;
    activeWorkflowIdRef.current = activeWorkflowId;
  }, [activeProjectId, activeWorkflowId]);

  const updateProjectById = useCallback(
    (projectId: string, updater: (project: Project) => Project) => {
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.metadata.id === projectId ? updater(project) : project,
        ),
      );
    },
    [],
  );

  const updateActiveWorkflow = useCallback(
    (updater: (workflow: WorkflowGraphData) => WorkflowGraphData) => {
      if (!activeProject || !activeWorkflow) {
        return;
      }

      updateProjectById(activeProject.metadata.id, (project) => ({
        ...project,
        workflows: project.workflows.map((workflow) =>
          workflow.id === activeWorkflow.id ? updater(workflow) : workflow,
        ),
      }));
    },
    [activeProject, activeWorkflow, updateProjectById],
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

        const nextProjects = [projectFromCoreGraph(graph)];
        const restoredWorkflowId = resolveRestoredWorkflowId(
          nextProjects,
          readWorkspaceNavigationState().lastOpenedWorkflowId,
        );
        setProjects(nextProjects);
        setSelectedProjectId(nextProjects[0]?.metadata.id ?? null);
        setActiveWorkflowId(restoredWorkflowId);
        setSelectedNodeId(restoredWorkflowId ? graph.nodes[0]?.id ?? null : null);
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

    connection
      .getRuntimeDiagnostics()
      .then((diagnostics) => {
        if (!active) {
          return;
        }
        setProjects((currentProjects) =>
          currentProjects.map((project, index) =>
            project.metadata.id === activeProjectIdRef.current ||
            (!activeProjectIdRef.current && index === 0)
              ? { ...project, diagnostics }
              : project,
          ),
        );
      })
      .catch(() => undefined);

    const unsubscribe = connection.subscribe((event) => {
      setProjects((currentProjects) =>
        currentProjects.map((project, index) =>
          project.metadata.id === activeProjectIdRef.current ||
          (!activeProjectIdRef.current && index === 0)
            ? applyRuntimeEvent(project, event, activeWorkflowIdRef.current)
            : project,
        ),
      );
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [connection]);

  const publishWorkflow = useCallback(
    (workflow: WorkflowGraphData) => {
      void connection?.replaceGraph(workflowToCoreGraph(workflow)).catch(() => {
        // The web shell can run before core is started; keep local edits responsive.
      });
    },
    [connection],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<WorkflowNode>[]) => {
      if (!activeWorkflow) {
        return;
      }

      updateActiveWorkflow((workflow) => {
        const nextWorkflow = {
          ...workflow,
          nodes: applyNodeChanges(changes, workflow.nodes),
        };
        publishWorkflow(nextWorkflow);
        return nextWorkflow;
      });
    },
    [activeWorkflow, publishWorkflow, updateActiveWorkflow],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!activeWorkflow) {
        return;
      }

      updateActiveWorkflow((workflow) => {
        const nextWorkflow = {
          ...workflow,
          edges: applyEdgeChanges(changes, workflow.edges),
        };
        publishWorkflow(nextWorkflow);
        return nextWorkflow;
      });
    },
    [activeWorkflow, publishWorkflow, updateActiveWorkflow],
  );

  const onConnect = useCallback(
    (connectionParams: Connection) => {
      updateActiveWorkflow((workflow) => {
        const nextWorkflow = {
          ...workflow,
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
            workflow.edges,
          ),
        };
        publishWorkflow(nextWorkflow);
        return nextWorkflow;
      });
    },
    [publishWorkflow, updateActiveWorkflow],
  );

  const selectDashboard = () => {
    setActiveWorkflowId(null);
    setSelectedNodeId(null);
    setInspectorTab("project");
    setNavigationState({ lastOpenedWorkflowId: null });
    writeWorkspaceNavigationState({ lastOpenedWorkflowId: null });
  };

  const selectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveWorkflowId(null);
    setSelectedNodeId(null);
    setInspectorTab("project");
    setNavigationState({ lastOpenedWorkflowId: null });
    writeWorkspaceNavigationState({ lastOpenedWorkflowId: null });
  };

  const selectWorkflow = (workflowId: string) => {
    const project = findProjectForWorkflow(projects, workflowId);
    if (!project) {
      selectDashboard();
      return;
    }

    setSelectedProjectId(project.metadata.id);
    setActiveWorkflowId(workflowId);
    setSelectedNodeId(findWorkflow(projects, workflowId)?.nodes[0]?.id ?? null);
    setInspectorTab("project");
    setNavigationState({ lastOpenedWorkflowId: workflowId });
    writeWorkspaceNavigationState({ lastOpenedWorkflowId: workflowId });
  };

  const createProject = (name: string, cwd: string) => {
    const projectId = makeStableId("project", name);
    const project = createWorkspaceProject(projectId, name, cwd);

    setProjects((currentProjects) => [...currentProjects, project]);
    setSelectedProjectId(project.metadata.id);
    setActiveWorkflowId(null);
    setSelectedNodeId(null);
    setInspectorTab("project");
  };

  const createWorkflow = (projectId: string, name: string) => {
    const workflow = createEmptyWorkflow(projectId, makeStableId("workflow", name), name);
    updateProjectById(projectId, (project) => ({
      ...project,
      workflows: [...project.workflows, workflow],
    }));
    selectWorkflowAfterMutation(projectId, workflow.id);
  };

  const duplicateWorkflow = (workflowId = activeWorkflow?.id) => {
    if (!workflowId) {
      return;
    }

    const sourceProject = findProjectForWorkflow(projects, workflowId);
    const sourceWorkflow = findWorkflow(projects, workflowId);
    if (!sourceProject || !sourceWorkflow) {
      return;
    }

    const nextWorkflowId = makeStableId("workflow", `${sourceWorkflow.name} copy`);
    const workflow = duplicateWorkflowGraph(
      sourceWorkflow,
      nextWorkflowId,
      `${sourceWorkflow.name} copy`,
    );

    updateProjectById(sourceProject.metadata.id, (project) => ({
      ...project,
      workflows: [...project.workflows, workflow],
    }));
    selectWorkflowAfterMutation(sourceProject.metadata.id, workflow.id);
  };

  const selectWorkflowAfterMutation = (projectId: string, workflowId: string) => {
    setSelectedProjectId(projectId);
    setActiveWorkflowId(workflowId);
    setSelectedNodeId(null);
    setInspectorTab("project");
    setNavigationState({ lastOpenedWorkflowId: workflowId });
    writeWorkspaceNavigationState({ lastOpenedWorkflowId: workflowId });
  };

  const updateProjectField = (field: ProjectField, value: string) => {
    if (!activeProject) {
      return;
    }

    updateProjectById(activeProject.metadata.id, (project) => ({
      ...project,
      metadata: { ...project.metadata, [field]: value },
    }));
  };

  const updateSelectedNode = (
    field: keyof WorkflowNodeData,
    value: string,
  ) => {
    if (!selectedNodeId) {
      return;
    }

    updateActiveWorkflow((workflow) => {
      const nextWorkflow = {
        ...workflow,
        nodes: workflow.nodes.map((node) =>
          node.id === selectedNodeId
            ? { ...node, data: { ...node.data, [field]: value } }
            : node,
        ),
      };
      publishWorkflow(nextWorkflow);
      return nextWorkflow;
    });
  };

  const addNodeFromCatalog = (catalogNode: CatalogNode) => {
    if (!activeWorkflow) {
      return;
    }

    const nodeId = `${catalogNode.id.replace("/", "-")}-${Date.now().toString(36)}`;
    const nodeCount = activeWorkflow.nodes.length;
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

    updateActiveWorkflow((workflow) => {
      const nextWorkflow = {
        ...workflow,
        nodes: [...workflow.nodes, nextNode],
      };
      publishWorkflow(nextWorkflow);
      return nextWorkflow;
    });
    setSelectedNodeId(nodeId);
    setInspectorTab("node");
    setCatalogOpen(false);
  };

  const igniteFromSelectedNode = () => {
    if (!activeProject || !activeWorkflow) {
      return;
    }

    const nodeId = selectedNodeId ?? activeWorkflow.nodes[0]?.id;
    if (!nodeId) {
      return;
    }
    void connection
      ?.igniteSpark({
        nodeId,
        payload: {
          source: "web",
          projectId: activeProject.metadata.id,
          workflowId: activeWorkflow.id,
          cwd: activeProject.metadata.cwd,
          startedAt: new Date().toISOString(),
        },
      })
      .catch(() => undefined);
  };

  const extinguishSparks = () => {
    void connection?.extinguishSparks();
  };

  const releaseQueueForSelectedNode = () => {
    if (!selectedNodeId) {
      return;
    }

    void connection?.releaseQueue(selectedNodeId);
  };

  const resolveManualGateForSelectedNode = () => {
    if (!selectedNodeId || !activeProject) {
      return;
    }

    const spark = Object.values(activeProject.sparks).find(
      (candidate) => candidate.currentNodeId === selectedNodeId,
    );
    if (!spark) {
      return;
    }

    void connection?.resolveManualGate({
      sparkId: spark.id,
      payload: {
        ...((spark.payload && typeof spark.payload === "object" && !Array.isArray(spark.payload)
          ? spark.payload
          : {}) as Record<string, unknown>),
        manualAccepted: true,
      },
    });
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
    activeWorkflow,
    activeWorkflowId,
    addNodeFromCatalog,
    catalogDiagnostics,
    createProject,
    createWorkflow,
    duplicateWorkflow,
    inspectorTab,
    isCatalogOpen,
    isDashboardActive: !activeWorkflowId,
    isRunning,
    nodeCatalog,
    navigationState,
    onConnect,
    onEdgesChange,
    onNodesChange,
    projects,
    releaseQueueForSelectedNode,
    resolveManualGateForSelectedNode,
    selectDashboard,
    selectProject,
    selectWorkflow,
    selectedNodeId,
    selectedProjectId,
    setCatalogOpen,
    setInspectorTab,
    setSelectedNodeId,
    toggleRunState,
    updateProjectField,
    updateSelectedNode,
    visibleNodes,
  };
}

export function applyRuntimeEvent(
  project: Project,
  event: RuntimeEvent,
  workflowId: string | null,
): Project {
  const eventLog = [event, ...project.eventLog].slice(0, 24);
  const targetWorkflowId = workflowId ?? project.workflows[0]?.id ?? null;

  switch (event.type) {
    case "graphUpdated":
      return withDerivedActivity({
        ...project,
        workflows: replaceWorkflow(
          project.workflows,
          workflowFromCoreGraph(event.graph, project.metadata.id),
          targetWorkflowId,
        ),
        metadata: {
          ...project.metadata,
          name: event.graph.name,
        },
        eventLog,
      });
    case "sparkIgnited":
      return withDerivedActivity({
        ...project,
        sparks: {
          ...project.sparks,
          [event.spark.id]: event.spark,
        },
        workflows: updateWorkflow(project.workflows, targetWorkflowId, (workflow) => ({
          ...workflow,
          nodes: markSpark(workflow.nodes, event.spark),
        })),
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
        workflows: updateWorkflow(project.workflows, targetWorkflowId, (workflow) => ({
          ...workflow,
          edges: workflow.edges.map((edge) => ({
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
          nodes: nextSpark ? markSpark(workflow.nodes, nextSpark) : workflow.nodes,
        })),
        eventLog,
      });
    }
    case "nodeStatusChanged":
      return {
        ...project,
        workflows: updateWorkflow(project.workflows, targetWorkflowId, (workflow) => ({
          ...workflow,
          nodes: workflow.nodes.map((node) =>
            node.id === event.nodeId
              ? { ...node, data: { ...node.data, status: event.status } }
              : node,
          ),
        })),
        eventLog,
      };
    case "sparkBlocked":
      return withDerivedActivity({
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "blocked"),
        eventLog,
      });
    case "sparkWaiting":
      return withDerivedActivity({
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "blocked"),
        eventLog,
      });
    case "sparkFailed":
      return withDerivedActivity({
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "blocked"),
        eventLog,
      });
    case "sparkCompleted":
      return withDerivedActivity({
        ...project,
        sparks: setSparkStatus(project.sparks, event.sparkId, "completed"),
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
    case "queueChanged":
      return { ...project, eventLog };
    case "manualGateChanged":
      return { ...project, eventLog };
    case "diagnosticRecorded":
      return {
        ...project,
        diagnostics: [event.diagnostic, ...project.diagnostics].slice(0, 24),
        eventLog,
      };
    case "log":
      return { ...project, eventLog };
  }
}

export function resolveRestoredWorkflowId(
  projects: Project[],
  workflowId: string | null,
): string | null {
  return workflowId && findWorkflow(projects, workflowId) ? workflowId : null;
}

export function findWorkflow(
  projects: Project[],
  workflowId: string | null,
): WorkflowGraphData | null {
  if (!workflowId) {
    return null;
  }

  for (const project of projects) {
    const workflow = project.workflows.find((candidate) => candidate.id === workflowId);
    if (workflow) {
      return workflow;
    }
  }

  return null;
}

export function findProjectForWorkflow(
  projects: Project[],
  workflowId: string | null,
): Project | null {
  if (!workflowId) {
    return null;
  }

  return (
    projects.find((project) =>
      project.workflows.some((workflow) => workflow.id === workflowId),
    ) ?? null
  );
}

export function deriveWorkflowActivity(
  sparks: Record<string, Spark>,
): Project["activity"] {
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

export function duplicateWorkflowGraph(
  workflow: WorkflowGraphData,
  workflowId: string,
  name: string,
): WorkflowGraphData {
  return {
    ...workflow,
    id: workflowId,
    name,
    nodes: workflow.nodes.map((node) => ({
      ...node,
      selected: false,
      data: { ...node.data, sparkIds: [] },
      position: { ...node.position },
    })),
    edges: workflow.edges.map((edge) => ({
      ...edge,
      data: { ...edge.data },
      selected: false,
    })),
    coreGraph: {
      ...workflowToCoreGraph(workflow),
      id: workflowId,
      name,
    },
  };
}

export function createWorkspaceProject(
  projectId: string,
  name: string,
  cwd: string,
): Project {
  return {
    metadata: {
      id: projectId,
      name,
      groupId: "automation",
      cwd,
      owner: "Workspace",
      updatedAt: "Draft",
      description: "Workspace project created from the GUI.",
      trigger: "Manual ignite",
    },
    workflows: [],
    activity: {
      status: "idle",
      progress: 0,
      activeSparkCount: 0,
      blockedSparkCount: 0,
      completedSparkCount: 0,
      extinguishedSparkCount: 0,
    },
    diagnostics: [],
    sparks: {},
    eventLog: [],
  };
}

function updateWorkflow(
  workflows: WorkflowGraphData[],
  workflowId: string | null,
  updater: (workflow: WorkflowGraphData) => WorkflowGraphData,
): WorkflowGraphData[] {
  return workflows.map((workflow) =>
    workflow.id === workflowId ? updater(workflow) : workflow,
  );
}

function replaceWorkflow(
  workflows: WorkflowGraphData[],
  workflow: WorkflowGraphData,
  workflowId: string | null,
): WorkflowGraphData[] {
  if (!workflowId || !workflows.some((candidate) => candidate.id === workflowId)) {
    return [workflow];
  }

  return workflows.map((candidate) =>
    candidate.id === workflowId ? workflow : candidate,
  );
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

function makeStableId(prefix: string, name: string): string {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || prefix;

  return `${prefix}-${slug}-${Date.now().toString(36)}`;
}
