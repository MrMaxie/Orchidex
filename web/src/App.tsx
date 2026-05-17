import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { OrchidexWorkspace } from "@/features/workspace/components/orchidex-workspace";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");

    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  return (
    <TooltipProvider>
      <OrchidexWorkspace />
    </TooltipProvider>
  );
}

export default App;
