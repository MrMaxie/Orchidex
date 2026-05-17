import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return (
    <TooltipProvider>
      <WorkspaceShell />
    </TooltipProvider>
  );
}

export default App;
