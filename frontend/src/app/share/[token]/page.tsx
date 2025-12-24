"use client";

import { useEffect, useState, use } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  Panel,
  BackgroundVariant,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Brain, Loader2, User, Calendar } from "lucide-react";
import { api } from "@/lib/api";
import { MindmapNode } from "@/components/mindmap/mindmap-node";

const nodeTypes = {
  mindmap: MindmapNode,
};

interface SharedMindmap {
  id: string;
  title: string;
  description?: string;
  data: { nodes: Node[]; edges: Edge[] };
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
}

function SharedMindmapContent({ token }: { token: string }) {
  const [mindmap, setMindmap] = useState<SharedMindmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMindmap();
  }, [token]);

  const loadMindmap = async () => {
    try {
      const data = await api.getSharedMindmap(token) as SharedMindmap;
      setMindmap(data);
    } catch (err: any) {
      setError(err.message || "Failed to load mindmap");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading mindmap...</p>
        </div>
      </div>
    );
  }

  if (error || !mindmap) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md p-8">
          <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Mindmap Not Found</h1>
          <p className="text-muted-foreground mb-6">
            {error || "This mindmap may have been deleted or the link has expired."}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const nodes = mindmap.data?.nodes || [];
  const edges = mindmap.data?.edges || [];
  const authorName = [mindmap.user.firstName, mindmap.user.lastName]
    .filter(Boolean)
    .join(" ") || "Anonymous";

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Brain className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold">{mindmap.title}</h1>
            {mindmap.description && (
              <p className="text-sm text-muted-foreground">{mindmap.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{new Date(mindmap.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.4, maxZoom: 0.8 }}
          minZoom={0.1}
          maxZoom={2}
          className="bg-gradient-to-br from-slate-50 to-slate-100"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnScroll
        >
          <Controls showInteractive={false} className="!bg-background !border !shadow-lg !rounded-lg" />
          <MiniMap
            nodeColor={(node) => node.data?.color || "#3b82f6"}
            maskColor="rgba(0,0,0,0.08)"
            className="!bg-background !border !shadow-lg !rounded-lg"
          />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#cbd5e1" />
          <Panel position="bottom-center" className="bg-background/95 backdrop-blur-sm rounded-xl p-3 mb-4 shadow-lg border">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-muted-foreground">
                <strong>{nodes.length}</strong> nodes • <strong>{edges.length}</strong> connections
              </span>
              <div className="w-px h-4 bg-border" />
              <span className="text-xs text-muted-foreground">View-only mode</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function SharedMindmapPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return (
    <ReactFlowProvider>
      <SharedMindmapContent token={token} />
    </ReactFlowProvider>
  );
}
