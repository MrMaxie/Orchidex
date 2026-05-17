import { useEffect, useState } from "react";

import type { ConnectionStrategy } from "@/features/workspace/contracts";
import { createDefaultConnectionStrategy } from "@/features/workspace/connections/default-connection";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";

export function OrchidexWorkspace({
  connection,
}: {
  connection?: ConnectionStrategy;
}) {
  const [resolvedConnection, setResolvedConnection] =
    useState<ConnectionStrategy | null>(connection ?? null);

  useEffect(() => {
    if (connection) {
      setResolvedConnection(connection);
      return;
    }

    let active = true;
    void createDefaultConnectionStrategy().then((strategy) => {
      if (active) {
        setResolvedConnection(strategy);
      }
    });

    return () => {
      active = false;
    };
  }, [connection]);

  return <WorkspaceShell connection={resolvedConnection} />;
}
