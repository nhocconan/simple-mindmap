"use client";

import { useCallback, useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  BackgroundVariant,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Brain, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { MindmapNode } from "@/components/mindmap/mindmap-node";

const nodeTypes = {
  mindmap: MindmapNode,
};

interface MindmapData {
  id: string;
  title: string;
  description?: string;
  data: { nodes: Node[]; edges: Edge[] };
  visibility: string;
  user?: any;
}

function AdminMindmapViewContent({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken, user, isAuthenticated } = useAuthStore();
  const { isHydrated } = useAuth();
  const [mindmap, setMindmap] = useState<MindmapData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!accessToken || !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user && user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    if (user) {
      loadMindmap();
    }
  }, [isHydrated, accessToken, isAuthenticated, id, user]);

  const loadMindmap = async () => {
    if (!accessToken) return;
    try {
      const data: any = await api.getAdminMindmapById(accessToken, id);
      setMindmap(data);
      const loadedNodes = data.data?.nodes || [];
      const loadedEdges = data.data?.edges || [];
      setNodes(loadedNodes);
      setEdges(loadedEdges);
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to load mindmap", 
        variant: "destructive" 
      });
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push("/admin")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">{mindmap?.title}</h1>
              {mindmap?.user && (
                <p className="text-xs text-muted-foreground">
                  by {mindmap.user.email}
                </p>
              )}
            </div>
          </div>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            Admin View - Read Only
          </span>
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
          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
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
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function AdminMindmapViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ReactFlowProvider>
      <AdminMindmapViewContent id={id} />
    </ReactFlowProvider>
  );
}
