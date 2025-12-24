"use client";

import { useCallback, useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  getRectOfNodes,
  getTransformForBounds,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Brain,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Maximize,
  Copy,
  Undo,
  Redo,
  Download,
  Share2,
  Link2,
  Check,
  X,
  FileImage,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";
import { MindmapNode } from "@/components/mindmap/mindmap-node";
import { toPng, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";

const nodeTypes = {
  mindmap: MindmapNode,
};

const NODE_COLORS = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Green", color: "#10b981" },
  { name: "Orange", color: "#f59e0b" },
  { name: "Red", color: "#ef4444" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Pink", color: "#ec4899" },
  { name: "Cyan", color: "#06b6d4" },
  { name: "Indigo", color: "#6366f1" },
  { name: "Lime", color: "#84cc16" },
  { name: "Teal", color: "#14b8a6" },
  { name: "Slate", color: "#64748b" },
  { name: "Dark", color: "#1e293b" },
];

const TEXT_COLORS = [
  { name: "White", color: "#ffffff" },
  { name: "Black", color: "#000000" },
  { name: "Gray", color: "#374151" },
  { name: "Light Gray", color: "#9ca3af" },
];

interface MindmapData {
  id: string;
  title: string;
  description?: string;
  data: { nodes: Node[]; edges: Edge[] };
  visibility: string;
  shareToken?: string;
}

function MindmapEditorContent({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { accessToken, isAuthenticated } = useAuthStore();
  const { isHydrated } = useAuth();
  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [mindmap, setMindmap] = useState<MindmapData | null>(null);
  const [title, setTitle] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedColor, setSelectedColor] = useState(NODE_COLORS[0].color);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[0].color);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectingMode, setConnectingMode] = useState(false);
  const [exporting, setExporting] = useState(false);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!accessToken || !isAuthenticated) {
      router.push("/login");
      return;
    }
    loadMindmap();
  }, [isHydrated, accessToken, isAuthenticated, id]);

  const loadMindmap = async () => {
    if (!accessToken) return;
    try {
      const data: any = await api.getMindmap(accessToken, id);
      setMindmap(data);
      setTitle(data.title);
      const loadedNodes = (data.data?.nodes || []).map((n: Node) => ({ ...n, selected: false }));
      const loadedEdges = data.data?.edges || [];
      setNodes(loadedNodes);
      setEdges(loadedEdges);
      setHistory([{ nodes: loadedNodes, edges: loadedEdges }]);
      setHistoryIndex(0);
      if (data.shareToken) {
        setShareLink(`${window.location.origin}/share/${data.shareToken}`);
      }
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, duration: 400 });
      }, 100);
      initialLoadRef.current = false;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load mindmap", variant: "destructive" });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = useCallback(() => {
    if (initialLoadRef.current) return;
    setHasChanges(true);
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ nodes: [...nodes], edges: [...edges] });
      return newHistory.slice(-50);
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [nodes, edges, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setEdges(prevState.edges);
      setHistoryIndex((prev) => prev - 1);
      setHasChanges(true);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex((prev) => prev + 1);
      setHasChanges(true);
    }
  }, [history, historyIndex, setNodes, setEdges]);

  const saveMindmap = useCallback(async () => {
    if (!accessToken || !mindmap) return;
    setSaving(true);
    try {
      await api.updateMindmap(accessToken, id, { title, data: { nodes, edges } });
      setHasChanges(false);
      toast({ title: "Saved!", description: "Mindmap saved successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [accessToken, id, title, nodes, edges, mindmap, toast]);

  const onConnect = useCallback(
    (connection: Connection) => {
      saveToHistory();
      setEdges((eds) =>
        addEdge({
          ...connection,
          type: "smoothstep",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
          style: { strokeWidth: 2, stroke: "#94a3b8" },
        }, eds)
      );
    },
    [setEdges, saveToHistory]
  );

  const addChildNode = useCallback((parentId?: string) => {
    saveToHistory();
    const selectedNodes = nodes.filter((n) => n.selected);
    const targetParent = parentId ? nodes.find((n) => n.id === parentId) : selectedNodes[0];

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "mindmap",
      position: targetParent
        ? { x: targetParent.position.x + 200, y: targetParent.position.y + (Math.random() - 0.5) * 100 }
        : { x: Math.random() * 400 + 200, y: Math.random() * 300 + 100 },
      data: { 
        label: "", 
        color: selectedColor, 
        textColor: selectedTextColor,
        isNew: true,
        onEditComplete: () => {
          setNodes((nds) => nds.map((n) => 
            n.id === newNode.id ? { ...n, data: { ...n.data, isNew: false } } : n
          ));
        },
        onLabelChange: (newLabel: string) => {
          setNodes((nds) => nds.map((n) => 
            n.id === newNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n
          ));
          saveToHistory();
        }
      },
      selected: true,
    };

    // Deselect other nodes
    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);

    if (targetParent) {
      setEdges((eds) =>
        addEdge({
          id: `edge-${Date.now()}`,
          source: targetParent.id,
          target: newNode.id,
          type: "smoothstep",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
          style: { strokeWidth: 2, stroke: "#94a3b8" },
        }, eds)
      );
    }
  }, [nodes, selectedColor, selectedTextColor, setNodes, setEdges, saveToHistory]);

  const addSiblingNode = useCallback(() => {
    saveToHistory();
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) { addChildNode(); return; }

    const selectedNode = selectedNodes[0];
    const parentEdge = edges.find((e) => e.target === selectedNode.id);

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: "mindmap",
      position: { x: selectedNode.position.x, y: selectedNode.position.y + 100 },
      data: { 
        label: "", 
        color: selectedColor, 
        textColor: selectedTextColor,
        isNew: true,
        onEditComplete: () => {
          setNodes((nds) => nds.map((n) => 
            n.id === newNode.id ? { ...n, data: { ...n.data, isNew: false } } : n
          ));
        },
        onLabelChange: (newLabel: string) => {
          setNodes((nds) => nds.map((n) => 
            n.id === newNode.id ? { ...n, data: { ...n.data, label: newLabel } } : n
          ));
          saveToHistory();
        }
      },
      selected: true,
    };

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newNode]);

    if (parentEdge) {
      setEdges((eds) =>
        addEdge({
          id: `edge-${Date.now()}`,
          source: parentEdge.source,
          target: newNode.id,
          type: "smoothstep",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
          style: { strokeWidth: 2, stroke: "#94a3b8" },
        }, eds)
      );
    }
  }, [nodes, edges, selectedColor, selectedTextColor, setNodes, setEdges, saveToHistory, addChildNode]);

  const deleteSelectedNodes = useCallback(() => {
    const selectedNodeIds = nodes.filter((n) => n.selected).map((n) => n.id);
    if (selectedNodeIds.length === 0) return;
    saveToHistory();
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !selectedNodeIds.includes(e.source) && !selectedNodeIds.includes(e.target)));
  }, [nodes, setNodes, setEdges, saveToHistory]);

  const duplicateSelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;
    saveToHistory();

    const idMap = new Map<string, string>();
    const newNodes = selectedNodes.map((node) => {
      const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        position: { x: node.position.x + 50, y: node.position.y + 50 },
        selected: false,
        data: { ...node.data },
      };
    });

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const newEdges = edges
      .filter((e) => selectedIds.has(e.source) && selectedIds.has(e.target))
      .map((e) => ({
        ...e,
        id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: idMap.get(e.source) || e.source,
        target: idMap.get(e.target) || e.target,
      }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [nodes, edges, setNodes, setEdges, saveToHistory]);

  const changeNodeColor = useCallback((color: string) => {
    const hasSelected = nodes.some((n) => n.selected);
    if (hasSelected) {
      saveToHistory();
      setNodes((nds) => nds.map((node) => node.selected ? { ...node, data: { ...node.data, color } } : node));
    }
    setSelectedColor(color);
  }, [nodes, setNodes, saveToHistory]);

  const changeTextColor = useCallback((color: string) => {
    const hasSelected = nodes.some((n) => n.selected);
    if (hasSelected) {
      saveToHistory();
      setNodes((nds) => nds.map((node) => node.selected ? { ...node, data: { ...node.data, textColor: color } } : node));
    }
    setSelectedTextColor(color);
  }, [nodes, setNodes, saveToHistory]);

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const getChildNodeIds = useCallback((nodeId: string, visited = new Set<string>()): string[] => {
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);
    const childEdges = edges.filter((e) => e.source === nodeId);
    const childIds = childEdges.map((e) => e.target);
    return childIds.concat(childIds.flatMap((id) => getChildNodeIds(id, visited)));
  }, [edges]);

  const visibleNodes = nodes.map((node) => {
    const isChildOfCollapsed = Array.from(collapsedNodes).some((collapsedId) => {
      const childIds = getChildNodeIds(collapsedId);
      return childIds.includes(node.id);
    });
    return { 
      ...node, 
      hidden: isChildOfCollapsed, 
      data: { 
        ...node.data, 
        isCollapsed: collapsedNodes.has(node.id), 
        hasChildren: edges.some((e) => e.source === node.id), 
        onToggleCollapse: () => toggleCollapse(node.id),
        onLabelChange: (newLabel: string) => {
          setNodes((nds) => nds.map((n) => 
            n.id === node.id ? { ...n, data: { ...n.data, label: newLabel } } : n
          ));
          saveToHistory();
        }
      } 
    };
  });

  const visibleEdges = edges.filter((edge) => {
    const sourceHidden = visibleNodes.find((n) => n.id === edge.source)?.hidden;
    const targetHidden = visibleNodes.find((n) => n.id === edge.target)?.hidden;
    return !sourceHidden && !targetHidden;
  });

  // Export functions
  const exportToPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    setExporting(true);
    try {
      const nodesBounds = getRectOfNodes(nodes);
      const transform = getTransformForBounds(nodesBounds, nodesBounds.width, nodesBounds.height, 0.5, 2);
      
      const viewport = reactFlowWrapper.current.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewport) throw new Error("Viewport not found");
      
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#f8fafc",
        width: nodesBounds.width + 100,
        height: nodesBounds.height + 100,
        style: {
          width: `${nodesBounds.width + 100}px`,
          height: `${nodesBounds.height + 100}px`,
          transform: `translate(${-nodesBounds.x + 50}px, ${-nodesBounds.y + 50}px)`,
        },
      });
      
      const link = document.createElement("a");
      link.download = `${title || "mindmap"}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({ title: "Exported!", description: "PNG downloaded successfully" });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Error", description: "Failed to export PNG", variant: "destructive" });
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  }, [nodes, title, toast]);

  const exportToPdf = useCallback(async () => {
    if (!reactFlowWrapper.current) return;
    setExporting(true);
    try {
      const nodesBounds = getRectOfNodes(nodes);
      const viewport = reactFlowWrapper.current.querySelector(".react-flow__viewport") as HTMLElement;
      if (!viewport) throw new Error("Viewport not found");
      
      const dataUrl = await toPng(viewport, {
        backgroundColor: "#ffffff",
        width: nodesBounds.width + 100,
        height: nodesBounds.height + 100,
        style: {
          width: `${nodesBounds.width + 100}px`,
          height: `${nodesBounds.height + 100}px`,
          transform: `translate(${-nodesBounds.x + 50}px, ${-nodesBounds.y + 50}px)`,
        },
      });
      
      const pdf = new jsPDF({
        orientation: nodesBounds.width > nodesBounds.height ? "landscape" : "portrait",
        unit: "px",
        format: [nodesBounds.width + 100, nodesBounds.height + 100],
      });
      
      pdf.addImage(dataUrl, "PNG", 0, 0, nodesBounds.width + 100, nodesBounds.height + 100);
      pdf.save(`${title || "mindmap"}.pdf`);
      
      toast({ title: "Exported!", description: "PDF downloaded successfully" });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Error", description: "Failed to export PDF", variant: "destructive" });
    } finally {
      setExporting(false);
      setShowExportMenu(false);
    }
  }, [nodes, title, toast]);

  // Share functions
  const generateShareLink = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response: any = await api.shareMindmap(accessToken, id);
      const link = `${window.location.origin}/share/${response.shareToken}`;
      setShareLink(link);
      await navigator.clipboard.writeText(link);
      toast({ title: "Link copied!", description: "Share link copied to clipboard" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to generate link", variant: "destructive" });
    }
  }, [accessToken, id, toast]);

  const copyShareLink = useCallback(async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      toast({ title: "Copied!", description: "Link copied to clipboard" });
    }
  }, [shareLink, toast]);

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelectedNodes(); }
      else if (e.key === "Tab") { e.preventDefault(); addChildNode(); }
      else if (e.key === "Enter") { e.preventDefault(); addSiblingNode(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "y") { e.preventDefault(); redo(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); duplicateSelectedNodes(); }
      else if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); saveMindmap(); }
      else if (e.key === "c" && !e.metaKey && !e.ctrlKey) { setConnectingMode((prev) => !prev); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelectedNodes, addChildNode, addSiblingNode, undo, redo, duplicateSelectedNodes, saveMindmap]);

  const fitView = useCallback(() => { reactFlowInstance.fitView({ padding: 0.3, maxZoom: 1 }); }, [reactFlowInstance]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu]")) {
        setShowStylePicker(false);
        setShowExportMenu(false);
        setShowShareMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const selectedNodeCount = nodes.filter((n) => n.selected).length;

  return (
    <div className="h-screen flex flex-col">
      <header className="border-b bg-background px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }} className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 w-64" placeholder="Mindmap Title" />
          </div>
          {hasChanges && <span className="text-xs text-orange-500 font-medium animate-pulse">• Unsaved</span>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={undo} title="Undo (Ctrl+Z)" disabled={historyIndex <= 0}><Undo className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={redo} title="Redo (Ctrl+Y)" disabled={historyIndex >= history.length - 1}><Redo className="h-4 w-4" /></Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={() => addChildNode()} title="Add Node (Tab)"><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={duplicateSelectedNodes} title="Duplicate (Ctrl+D)"><Copy className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={deleteSelectedNodes} title="Delete (Del)"><Trash2 className="h-4 w-4" /></Button>
          <div className="w-px h-6 bg-border mx-1" />
          
          {/* Style Picker */}
          <div className="relative" data-menu>
            <Button 
              variant={showStylePicker ? "secondary" : "ghost"} 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); setShowStylePicker(!showStylePicker); setShowExportMenu(false); setShowShareMenu(false); }}
              className="gap-2"
            >
              <div className="w-4 h-4 rounded-full border-2 border-background shadow-sm" style={{ backgroundColor: selectedColor }} />
              Style
            </Button>
            {showStylePicker && (
              <div className="absolute top-full right-0 mt-2 p-4 bg-background border rounded-xl shadow-xl z-50 w-64" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Node Color</div>
                    <div className="grid grid-cols-6 gap-2">
                      {NODE_COLORS.map(({ name, color }) => (
                        <button
                          key={color}
                          className="w-7 h-7 rounded-lg border-2 hover:scale-110 transition-transform"
                          style={{ 
                            backgroundColor: color, 
                            borderColor: color === selectedColor ? "#000" : "transparent",
                            boxShadow: color === selectedColor ? "0 0 0 2px #fff, 0 0 0 4px #000" : "none"
                          }}
                          onClick={() => changeNodeColor(color)}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Text Color</div>
                    <div className="grid grid-cols-4 gap-2">
                      {TEXT_COLORS.map(({ name, color }) => (
                        <button
                          key={color}
                          className="w-7 h-7 rounded-lg border-2 hover:scale-110 transition-transform flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: color === "#ffffff" ? "#f1f5f9" : color,
                            borderColor: color === selectedTextColor ? "#3b82f6" : "#e2e8f0",
                            color: color === "#ffffff" || color === "#9ca3af" ? "#000" : "#fff"
                          }}
                          onClick={() => changeTextColor(color)}
                          title={name}
                        >
                          A
                        </button>
                      ))}
                    </div>
                  </div>
                  {selectedNodeCount > 0 && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      {selectedNodeCount} node{selectedNodeCount > 1 ? "s" : ""} selected
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Export Menu */}
          <div className="relative" data-menu>
            <Button 
              variant={showExportMenu ? "secondary" : "ghost"} 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); setShowStylePicker(false); setShowShareMenu(false); }}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export
            </Button>
            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 p-2 bg-background border rounded-xl shadow-xl z-50 w-48" onClick={(e) => e.stopPropagation()}>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  onClick={exportToPng}
                >
                  <FileImage className="h-4 w-4 text-blue-500" />
                  Export as PNG
                </button>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  onClick={exportToPdf}
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  Export as PDF
                </button>
              </div>
            )}
          </div>

          {/* Share Menu */}
          <div className="relative" data-menu>
            <Button 
              variant={showShareMenu ? "secondary" : "ghost"} 
              size="sm" 
              onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); setShowStylePicker(false); setShowExportMenu(false); }}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            {showShareMenu && (
              <div className="absolute top-full right-0 mt-2 p-4 bg-background border rounded-xl shadow-xl z-50 w-80" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                  <div className="text-sm font-medium">Share this mindmap</div>
                  {shareLink ? (
                    <div className="flex gap-2">
                      <Input value={shareLink} readOnly className="text-xs" />
                      <Button size="sm" variant="secondary" onClick={copyShareLink}>
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={generateShareLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Generate Share Link
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Anyone with the link can view this mindmap
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="icon" onClick={fitView} title="Fit View"><Maximize className="h-4 w-4" /></Button>
          <Button size="sm" onClick={saveMindmap} disabled={saving} className="ml-2">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      </header>

      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.4, maxZoom: 0.8 }}
          minZoom={0.1}
          maxZoom={2}
          className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
          deleteKeyCode={null}
          multiSelectionKeyCode="Shift"
          selectionOnDrag
          panOnScroll
          connectionMode={connectingMode ? ConnectionMode.Loose : ConnectionMode.Strict}
          connectOnClick={connectingMode}
          defaultEdgeOptions={{ type: "smoothstep", animated: false, markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" }, style: { strokeWidth: 2, stroke: "#94a3b8" } }}
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
              <span className="text-muted-foreground"><strong>{nodes.length}</strong> nodes • <strong>{edges.length}</strong> connections</span>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Tab</kbd> add child</span>
                <span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Enter</kbd> add sibling</span>
                <span><kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">C</kbd> connect</span>
              </div>
              {connectingMode && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">Connect Mode</span>}
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

export default function MindmapEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReactFlowProvider><MindmapEditorContent id={id} /></ReactFlowProvider>;
}
