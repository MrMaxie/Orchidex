import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

import type {
  ConnectionStrategy,
  CoreGraph,
  IgniteSparkInput,
  RuntimeEvent,
  Spark,
} from "@/features/workspace/contracts";

export function createTauriIpcConnectionStrategy(): ConnectionStrategy {
  return {
    getGraph: () => invoke<CoreGraph>("get_graph"),
    replaceGraph: (graph) => invoke<CoreGraph>("replace_graph", { graph }),
    igniteSpark: (input: IgniteSparkInput) =>
      invoke<Spark>("ignite_spark", {
        request: {
          nodeId: input.nodeId,
          payload: input.payload ?? {},
        },
      }),
    extinguishSparks: () => invoke<number>("extinguish_sparks"),
    subscribe: (handler) => {
      let unsubscribe: (() => void) | null = null;
      void listen<RuntimeEvent>("orchidex://runtime-event", (event) => {
        handler(event.payload);
      }).then((cleanup) => {
        unsubscribe = cleanup;
      });

      return () => {
        unsubscribe?.();
      };
    },
  };
}
