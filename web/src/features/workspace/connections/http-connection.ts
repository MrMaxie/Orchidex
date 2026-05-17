import type {
  ConnectionStrategy,
  CoreGraph,
  IgniteSparkInput,
  RuntimeEvent,
  Spark,
} from "@/features/workspace/contracts";

export function createHttpConnectionStrategy(
  baseUrl = "http://127.0.0.1:3869",
): ConnectionStrategy {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "content-type": "application/json" },
      ...init,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response.json() as Promise<T>;
  }

  return {
    getGraph: () => request<CoreGraph>("/graph"),
    replaceGraph: (graph) =>
      request<CoreGraph>("/graph", {
        method: "PUT",
        body: JSON.stringify(graph),
      }),
    igniteSpark: (input: IgniteSparkInput) =>
      request<Spark>("/sparks", {
        method: "POST",
        body: JSON.stringify({
          nodeId: input.nodeId,
          payload: input.payload ?? {},
        }),
      }),
    extinguishSparks: () =>
      request<number>("/sparks/extinguish", { method: "POST" }),
    subscribe: (handler) => {
      const source = new EventSource(`${baseUrl}/events`);
      source.onmessage = (event) => {
        handler(JSON.parse(event.data) as RuntimeEvent);
      };
      const eventNames = [
        "graph-updated",
        "spark-ignited",
        "spark-moved",
        "node-status-changed",
        "spark-blocked",
        "spark-extinguished",
        "all-sparks-extinguished",
        "log",
      ];
      for (const eventName of eventNames) {
        source.addEventListener(eventName, (event) => {
          handler(JSON.parse((event as MessageEvent).data) as RuntimeEvent);
        });
      }
      return () => source.close();
    },
  };
}
