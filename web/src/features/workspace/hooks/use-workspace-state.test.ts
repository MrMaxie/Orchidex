import { describe, expect, test } from "bun:test";

import { workflowToCoreGraph } from "@/features/workspace/data/mock-projects";
import {
  applyRuntimeEvent,
  createWorkspaceProject,
  deriveWorkflowActivity,
  duplicateWorkflowGraph,
  resolveRestoredWorkflowId,
} from "@/features/workspace/hooks/use-workspace-state";
import {
  createEmptyWorkflow,
  initialProjects,
} from "@/features/workspace/data/mock-projects";
import type { Spark } from "@/features/workspace/contracts";

describe("workspace navigation model", () => {
  test("falls back to Dashboard when no stored workflow exists", () => {
    expect(resolveRestoredWorkflowId(initialProjects, null)).toBeNull();
    expect(resolveRestoredWorkflowId(initialProjects, "missing-workflow")).toBeNull();
  });

  test("restores an existing workflow id", () => {
    const workflowId = initialProjects[0]?.workflows[0]?.id ?? "";

    expect(resolveRestoredWorkflowId(initialProjects, workflowId)).toBe(workflowId);
  });
});

describe("workspace graph model", () => {
  test("creates projects with editable cwd metadata", () => {
    const project = createWorkspaceProject(
      "project-ui",
      "UI Project",
      "D:/work/ui-project",
    );

    expect(project.metadata).toMatchObject({
      cwd: "D:/work/ui-project",
      id: "project-ui",
      name: "UI Project",
    });
    expect(project.workflows).toEqual([]);
  });

  test("ships the fixture project with an absolute cwd", () => {
    const cwd = initialProjects[0]?.metadata.cwd ?? "";

    expect(cwd).not.toBe(".");
    expect(cwd).toMatch(/^(?:[A-Za-z]:[\\/]|\/)/);
  });

  test("creates empty workflows owned by a project", () => {
    const workflow = createEmptyWorkflow("project-ui", "workflow-ui", "UI Workflow");

    expect(workflow).toMatchObject({
      id: "workflow-ui",
      name: "UI Workflow",
      projectId: "project-ui",
    });
    expect(workflow.nodes).toEqual([]);
    expect(workflow.edges).toEqual([]);
  });

  test("preserves port-aware edges when publishing to the core graph", () => {
    const workflow = initialProjects[0]?.workflows[0];
    if (!workflow) {
      throw new Error("Fixture workflow is missing");
    }

    const graph = workflowToCoreGraph(workflow);

    expect(graph.edges[0]).toMatchObject({
      sourcePort: "out",
      targetPort: "in",
    });
  });

  test("duplicates workflow identity without copying active spark selection", () => {
    const workflow = initialProjects[0]?.workflows[0];
    if (!workflow) {
      throw new Error("Fixture workflow is missing");
    }

    const duplicate = duplicateWorkflowGraph(workflow, "workflow-copy", "Workflow copy");

    expect(duplicate.id).toBe("workflow-copy");
    expect(duplicate.coreGraph.id).toBe("workflow-copy");
    expect(duplicate.nodes).toHaveLength(workflow.nodes.length);
    expect(duplicate.nodes.every((node) => node.data.sparkIds?.length === 0)).toBe(true);
  });
});

describe("workspace runtime activity", () => {
  test("derives activity from spark status counts", () => {
    const sparks: Record<string, Spark> = {
      active: {
        currentNodeId: "manual-start",
        id: "active",
        payload: {},
        status: "active",
      },
      blocked: {
        currentNodeId: "manual-start",
        id: "blocked",
        payload: {},
        status: "blocked",
      },
      completed: {
        currentNodeId: "manual-start",
        id: "completed",
        payload: {},
        status: "completed",
      },
    };

    expect(deriveWorkflowActivity(sparks)).toMatchObject({
      activeSparkCount: 1,
      blockedSparkCount: 1,
      completedSparkCount: 1,
      progress: 33,
      status: "blocked",
    });
  });

  test("updates spark activity without mutating project metadata", () => {
    const project = initialProjects[0];
    if (!project) {
      throw new Error("Fixture project is missing");
    }

    const nextProject = applyRuntimeEvent(
      project,
      {
        spark: {
          currentNodeId: "manual-start",
          id: "spark-1",
          payload: {},
          status: "active",
        },
        type: "sparkIgnited",
      },
      project.workflows[0]?.id ?? null,
    );

    expect(nextProject.metadata).toEqual(project.metadata);
    expect(nextProject.activity.status).toBe("running");
    expect(nextProject.workflows[0]?.nodes[0]?.data.sparkIds).toContain("spark-1");
  });
});
