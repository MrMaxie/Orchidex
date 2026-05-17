import { useCallback } from "react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";

const initialNodes: Node[] = [
  {
    id: "idea",
    position: { x: 0, y: 0 },
    data: { label: "Map an idea" },
    type: "input",
  },
  {
    id: "flow",
    position: { x: 280, y: 140 },
    data: { label: "Shape the flow" },
  },
  {
    id: "ship",
    position: { x: 560, y: 0 },
    data: { label: "Ship to web + PC" },
    type: "output",
  },
];

const initialEdges: Edge[] = [
  {
    id: "idea-flow",
    source: "idea",
    target: "flow",
    animated: true,
    label: "compose",
  },
  {
    id: "flow-ship",
    source: "flow",
    target: "ship",
    animated: true,
    label: "deliver",
  },
];

function App() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((currentEdges) =>
        addEdge({ ...connection, animated: true }, currentEdges),
      ),
    [setEdges],
  );

  return (
    <main className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <section className="grid h-full w-full grid-rows-[auto_1fr] bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.24),_transparent_34rem),linear-gradient(135deg,_#020617_0%,_#0f172a_48%,_#111827_100%)]">
        <header className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 shadow-2xl shadow-black/30 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-teal-300">
              Orchidex
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Graph workspace for web and desktop.
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Tauri, React, TypeScript, Tailwind CSS, Bun, Vite, and ReactFlow
            are wired as the project baseline.
          </p>
        </header>

        <div className="h-full w-full p-4">
          <div className="h-full w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/80 shadow-2xl shadow-black/40 backdrop-blur">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              fitView
              attributionPosition="bottom-left"
            >
              <Background color="#334155" gap={28} />
              <MiniMap
                className="!bg-slate-950/90"
                maskColor="rgb(15 23 42 / 0.72)"
                nodeColor="#14b8a6"
                pannable
                zoomable
              />
              <Controls className="!border-white/10 !bg-slate-950/90 !text-slate-100" />
            </ReactFlow>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
