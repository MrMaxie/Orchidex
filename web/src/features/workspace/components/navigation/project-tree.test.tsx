import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ProjectTree } from "@/features/workspace/components/navigation/project-tree";
import { fallbackNodeCatalog, initialProjects } from "@/features/workspace/data/mock-projects";

describe("project tree navigation", () => {
  test("renders projects directly without synthetic category folders", () => {
    const html = renderToStaticMarkup(
      <TooltipProvider>
        <ProjectTree
          activeWorkflowId={null}
          isDashboardActive
          onCreateProject={() => undefined}
          onCreateWorkflow={() => undefined}
          onDashboardSelect={() => undefined}
          onDuplicateWorkflow={() => undefined}
          onProjectSelect={() => undefined}
          onWorkflowSelect={() => undefined}
          projects={initialProjects}
          selectedProjectId={initialProjects[0]?.metadata.id ?? null}
        />
      </TooltipProvider>,
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain("Clients project");
    expect(html).not.toContain("Automation");
    expect(html).not.toContain("Debug");
  });

  test("keeps debug tools in the node catalog", () => {
    const debugNodes = fallbackNodeCatalog.filter((node) =>
      node.id.startsWith("debug/"),
    );

    expect(debugNodes.map((node) => node.id)).toContain("debug/log");
    expect(debugNodes.every((node) => node.app === "Debug")).toBe(true);
  });
});
