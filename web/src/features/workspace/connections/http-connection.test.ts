import { afterEach, describe, expect, test } from "bun:test";

import { createHttpConnectionStrategy } from "@/features/workspace/connections/http-connection";
import type { RuntimeEvent } from "@/features/workspace/contracts";

const originalFetch = globalThis.fetch;
const originalEventSource = globalThis.EventSource;

afterEach(() => {
  globalThis.fetch = originalFetch;
  globalThis.EventSource = originalEventSource;
  TestEventSource.instances = [];
});

describe("createHttpConnectionStrategy", () => {
  test("maps runtime commands to the expected HTTP endpoints", async () => {
    const requests: Array<{ body?: string; method: string; url: string }> = [];
    globalThis.fetch = ((input, init) => {
      requests.push({
        body: typeof init?.body === "string" ? init.body : undefined,
        method: init?.method ?? "GET",
        url: input.toString(),
      });

      return Promise.resolve(
        new Response(JSON.stringify({ id: "ok", nodes: [], edges: [] }), {
          headers: { "content-type": "application/json" },
          status: 200,
        }),
      );
    }) as typeof fetch;

    const connection = createHttpConnectionStrategy("http://core.test");

    await connection.getGraph();
    await connection.getNodeCatalog();
    await connection.replaceGraph({ id: "graph", name: "Graph", nodes: [], edges: [] });
    await connection.igniteSpark({ nodeId: "manual-start", payload: { ok: true } });
    await connection.extinguishSparks();
    await connection.releaseQueue("queue-node");
    await connection.resolveManualGate({
      payload: { accepted: true },
      sparkId: "spark-1",
    });

    expect(requests.map((request) => [request.method, request.url])).toEqual([
      ["GET", "http://core.test/graph"],
      ["GET", "http://core.test/nodes"],
      ["PUT", "http://core.test/graph"],
      ["POST", "http://core.test/sparks"],
      ["POST", "http://core.test/sparks/extinguish"],
      ["POST", "http://core.test/runtime/queues/queue-node/release"],
      ["POST", "http://core.test/runtime/manual/resolve"],
    ]);
    expect(JSON.parse(requests[3]?.body ?? "{}")).toEqual({
      nodeId: "manual-start",
      payload: { ok: true },
    });
  });

  test("subscribes to default and named SSE runtime events", () => {
    globalThis.EventSource = TestEventSource as unknown as typeof EventSource;
    const events: RuntimeEvent[] = [];
    const connection = createHttpConnectionStrategy("http://core.test");

    const unsubscribe = connection.subscribe((event) => events.push(event));
    const source = TestEventSource.instances[0];
    if (!source) {
      throw new Error("EventSource was not created");
    }

    source.onmessage?.(
      new MessageEvent("message", {
        data: JSON.stringify({ message: "ready", nodeId: "log", type: "log" }),
      }),
    );
    source.dispatchNamed(
      "spark-ignited",
      JSON.stringify({
        spark: {
          currentNodeId: "manual-start",
          id: "spark-1",
          payload: {},
          status: "active",
        },
        type: "sparkIgnited",
      }),
    );
    unsubscribe();

    expect(source.url).toBe("http://core.test/events");
    expect(events.map((event) => event.type)).toEqual(["log", "sparkIgnited"]);
    expect(source.closed).toBe(true);
  });
});

class TestEventSource {
  static instances: TestEventSource[] = [];

  closed = false;
  listeners = new Map<string, Array<(event: MessageEvent<string>) => void>>();
  onmessage: ((event: MessageEvent<string>) => void) | null = null;

  constructor(public url: string) {
    TestEventSource.instances.push(this);
  }

  addEventListener(
    eventName: string,
    listener: (event: MessageEvent<string>) => void,
  ) {
    const listeners = this.listeners.get(eventName) ?? [];
    listeners.push(listener);
    this.listeners.set(eventName, listeners);
  }

  close() {
    this.closed = true;
  }

  dispatchNamed(eventName: string, data: string) {
    for (const listener of this.listeners.get(eventName) ?? []) {
      listener(new MessageEvent(eventName, { data }));
    }
  }
}
