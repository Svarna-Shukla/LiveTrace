"use client";

import { useMemo } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ServiceNode from "./nodes/ServiceNode";
import TraceEdge from "./edges/TraceEdge";
import type { ServiceNodeData, TraceEdgeData } from "@/lib/topology";

interface FlowCanvasProps {
  nodes: Node<ServiceNodeData>[];
  edges: Edge<TraceEdgeData>[];
  onNodesChange: OnNodesChange<Node<ServiceNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<TraceEdgeData>>;
  onNodeClick?: NodeMouseHandler<Node<ServiceNodeData>>;
  onPaneClick?: () => void;
}

export default function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onPaneClick,
}: FlowCanvasProps) {
  const nodeTypes = useMemo(() => ({ service: ServiceNode }), []);
  const edgeTypes = useMemo(() => ({ trace: TraceEdge }), []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.4}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      className="bg-canvas dark:bg-slate-950"
    >
      <Background variant={BackgroundVariant.Dots} color="#CBD5E1" gap={20} size={1.4} />
      <Controls
        className="!bottom-4 !left-4 !rounded-lg !border !border-border !shadow-md dark:!border-slate-700 [&>button]:!h-9 [&>button]:!w-9 sm:[&>button]:!h-7 sm:[&>button]:!w-7"
        showInteractive={false}
      />
      <MiniMap
        className="!bottom-4 !right-4 !rounded-lg !border !border-border !bg-white dark:!border-slate-700 dark:!bg-slate-900"
        maskColor="rgba(241, 245, 249, 0.6)"
        nodeColor="#CBD5E1"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}
