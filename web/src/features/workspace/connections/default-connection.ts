import type { ConnectionStrategy } from "@/features/workspace/contracts";
import { createHttpConnectionStrategy } from "@/features/workspace/connections/http-connection";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

export async function createDefaultConnectionStrategy(): Promise<ConnectionStrategy> {
  if (window.__TAURI_INTERNALS__) {
    const { createTauriIpcConnectionStrategy } = await import(
      "@/features/workspace/connections/tauri-ipc-connection"
    );
    return createTauriIpcConnectionStrategy();
  }

  return createHttpConnectionStrategy();
}
