"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain,
  Plus,
  Search,
  Star,
  Archive,
  Share2,
  MoreVertical,
  LogOut,
  Settings,
  User,
  Moon,
  Sun,
  Grid,
  List,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

interface Mindmap {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  isFavorite: boolean;
  isArchived: boolean;
  updatedAt: string;
  visibility: "PRIVATE" | "PUBLIC" | "SHARED";
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, accessToken, logout, fetchUser, isAuthenticated } = useAuthStore();
  const { isHydrated } = useAuth();
  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "favorites" | "archived">("all");

  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration
    
    if (!accessToken || !isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchUser();
    loadMindmaps();
  }, [isHydrated, accessToken, isAuthenticated]);

  const loadMindmaps = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filter === "favorites") params.isFavorite = "true";
      if (filter === "archived") params.isArchived = "true";
      else params.isArchived = "false";

      const response: any = await api.getMindmaps(accessToken, params);
      setMindmaps(response.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load mindmaps",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewMindmap = async () => {
    if (!accessToken) return;
    try {
      const mindmap: any = await api.createMindmap(accessToken, {
        title: "Untitled Mindmap",
        data: {
          nodes: [
            {
              id: "root",
              type: "mindmap",
              position: { x: 400, y: 300 },
              data: { label: "Central Idea" },
            },
          ],
          edges: [],
        },
      });
      router.push(`/mindmap/${mindmap.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create mindmap",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async (id: string) => {
    if (!accessToken) return;
    try {
      await api.toggleFavorite(accessToken, id);
      loadMindmaps();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  useEffect(() => {
    const debounce = setTimeout(loadMindmaps, 300);
    return () => clearTimeout(debounce);
  }, [search, filter]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold hidden sm:inline">MindMap Pro</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link href="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              {user?.role === "ADMIN" && (
                <Link href="/admin">
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="text-sm hidden md:inline">
                  {user?.firstName || user?.email?.split("@")[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mindmaps..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "favorites" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("favorites")}
            >
              <Star className="h-4 w-4 mr-1" />
              Favorites
            </Button>
            <Button
              variant={filter === "archived" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("archived")}
            >
              <Archive className="h-4 w-4 mr-1" />
              Archived
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setView("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setView("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Create New */}
        <Button onClick={createNewMindmap} className="mb-8">
          <Plus className="h-4 w-4 mr-2" />
          New Mindmap
        </Button>

        {/* Mindmaps Grid/List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : mindmaps.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No mindmaps yet</h3>
            <p className="text-muted-foreground mb-4">Create your first mindmap to get started</p>
            <Button onClick={createNewMindmap}>
              <Plus className="h-4 w-4 mr-2" />
              Create Mindmap
            </Button>
          </div>
        ) : (
          <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}>
            {mindmaps.map((mindmap) => (
              <Card
                key={mindmap.id}
                className={`group cursor-pointer hover:border-primary transition-colors ${view === "list" ? "flex" : ""}`}
                onClick={() => router.push(`/mindmap/${mindmap.id}`)}
              >
                {view === "grid" && (
                  <div className="h-32 bg-muted rounded-t-lg flex items-center justify-center">
                    <Brain className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <CardHeader className={view === "list" ? "flex-1" : ""}>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base line-clamp-1">{mindmap.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Updated {new Date(mindmap.updatedAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(mindmap.id);
                        }}
                      >
                        <Star className={`h-4 w-4 ${mindmap.isFavorite ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      </Button>
                      {mindmap.visibility === "SHARED" && (
                        <Share2 className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
