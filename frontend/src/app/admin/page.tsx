"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Settings, Activity, Database, ArrowLeft, BarChart3, Shield, Mail,
  RefreshCw, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, Brain,
  Eye, Check, X, Filter, Map, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api";

type Tab = "dashboard" | "users" | "mindmaps" | "settings" | "logs" | "cache";

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, accessToken, fetchUser, isAuthenticated } = useAuthStore();
  const { isHydrated } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [mindmaps, setMindmaps] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [logs, setLogs] = useState<any[]>([]);
  const [cache, setCache] = useState<any>(null);
  
  // Pagination states
  const [usersPagination, setUsersPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [mindmapsPagination, setMindmapsPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [logsPagination, setLogsPagination] = useState<PaginationState>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  
  // Filter states
  const [userFilter, setUserFilter] = useState({ search: "", role: "", status: "" });
  const [mindmapFilter, setMindmapFilter] = useState({ search: "", visibility: "" });
  const [logFilter, setLogFilter] = useState({ action: "", entity: "" });
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showMindmapModal, setShowMindmapModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editingMindmap, setEditingMindmap] = useState<any>(null);
  const [userForm, setUserForm] = useState({ email: "", password: "", firstName: "", lastName: "", role: "USER", isActive: true });
  const [mindmapForm, setMindmapForm] = useState({ title: "", description: "", visibility: "PRIVATE" });

  useEffect(() => {
    if (!isHydrated) return;
    
    if (!accessToken || !isAuthenticated) { 
      router.push("/login"); 
      return; 
    }
    fetchUser();
  }, [isHydrated, accessToken, isAuthenticated]);

  useEffect(() => {
    if (!isHydrated || !user) return;
    
    if (user.role !== "ADMIN") { 
      router.push("/dashboard"); 
      return; 
    }
    loadData();
  }, [isHydrated, user, activeTab, usersPagination.page, mindmapsPagination.page, logsPagination.page]);

  const loadData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case "dashboard":
          const dashboard = await api.getAdminDashboard(accessToken);
          setDashboardData(dashboard);
          break;
        case "users":
          const usersData: any = await api.getAdminUsers(accessToken, { 
            page: usersPagination.page, limit: usersPagination.limit, 
            search: userFilter.search, role: userFilter.role, status: userFilter.status 
          });
          setUsers(usersData.data || []);
          setUsersPagination(prev => ({ ...prev, total: usersData.total || 0, totalPages: usersData.totalPages || 1 }));
          break;
        case "mindmaps":
          const mindmapsData: any = await api.getAdminMindmaps(accessToken, {
            page: mindmapsPagination.page, limit: mindmapsPagination.limit,
            search: mindmapFilter.search, visibility: mindmapFilter.visibility
          });
          setMindmaps(mindmapsData.data || []);
          setMindmapsPagination(prev => ({ ...prev, total: mindmapsData.total || 0, totalPages: mindmapsData.totalPages || 1 }));
          break;
        case "settings":
          const settingsData = await api.getAdminSettings(accessToken);
          setSettings(settingsData);
          break;
        case "logs":
          const logsData: any = await api.getAdminLogs(accessToken, {
            page: logsPagination.page, limit: logsPagination.limit,
            action: logFilter.action, entity: logFilter.entity
          });
          setLogs(logsData.data || []);
          setLogsPagination(prev => ({ ...prev, total: logsData.total || 0, totalPages: logsData.totalPages || 1 }));
          break;
        case "cache":
          const cacheData = await api.getAdminCache(accessToken);
          setCache(cacheData);
          break;
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    if (activeTab === "users") setUsersPagination(prev => ({ ...prev, page: 1 }));
    else if (activeTab === "mindmaps") setMindmapsPagination(prev => ({ ...prev, page: 1 }));
    else if (activeTab === "logs") setLogsPagination(prev => ({ ...prev, page: 1 }));
    loadData();
  };

  // User CRUD
  const openUserModal = (u?: any) => {
    if (u) {
      setEditingUser(u);
      setUserForm({ email: u.email, password: "", firstName: u.firstName || "", lastName: u.lastName || "", role: u.role, isActive: u.isActive });
    } else {
      setEditingUser(null);
      setUserForm({ email: "", password: "", firstName: "", lastName: "", role: "USER", isActive: true });
    }
    setShowUserModal(true);
  };

  const saveUser = async () => {
    if (!accessToken) return;
    try {
      if (editingUser) {
        // Only include password if it's not empty when editing
        const updateData: any = { ...userForm };
        if (!updateData.password) {
          delete updateData.password;
        }
        await api.updateAdminUser(accessToken, editingUser.id, updateData);
        toast({ title: "Success", description: "User updated successfully" });
      } else {
        await api.createAdminUser(accessToken, userForm);
        toast({ title: "Success", description: "User created successfully" });
      }
      setShowUserModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save user", variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!accessToken || !confirm("Are you sure you want to delete this user? This will also delete all their mindmaps.")) return;
    try {
      await api.deleteAdminUser(accessToken, userId);
      toast({ title: "Success", description: "User deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    }
  };

  // Mindmap CRUD
  const openMindmapModal = (m?: any) => {
    if (m) {
      setEditingMindmap(m);
      setMindmapForm({ title: m.title, description: m.description || "", visibility: m.visibility });
    } else {
      setEditingMindmap(null);
      setMindmapForm({ title: "", description: "", visibility: "PRIVATE" });
    }
    setShowMindmapModal(true);
  };

  const saveMindmap = async () => {
    if (!accessToken) return;
    try {
      if (editingMindmap) {
        await api.updateAdminMindmap(accessToken, editingMindmap.id, mindmapForm);
        toast({ title: "Success", description: "Mindmap updated successfully" });
      }
      setShowMindmapModal(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to save mindmap", variant: "destructive" });
    }
  };

  const deleteMindmap = async (mindmapId: string) => {
    if (!accessToken || !confirm("Are you sure you want to delete this mindmap?")) return;
    try {
      await api.deleteAdminMindmap(accessToken, mindmapId);
      toast({ title: "Success", description: "Mindmap deleted successfully" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete mindmap", variant: "destructive" });
    }
  };

  const clearCache = async (pattern?: string) => {
    if (!accessToken) return;
    try {
      await api.clearAdminCache(accessToken, pattern);
      toast({ title: "Success", description: "Cache cleared successfully" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to clear cache", variant: "destructive" });
    }
  };

  const updateSettings = async () => {
    if (!accessToken) return;
    try {
      await api.updateAdminSettings(accessToken, settings);
      toast({ title: "Success", description: "Settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update settings", variant: "destructive" });
    }
  };

  const tabs = [
    { id: "dashboard" as Tab, label: "Dashboard", icon: BarChart3 },
    { id: "users" as Tab, label: "Users", icon: Users },
    { id: "mindmaps" as Tab, label: "Mindmaps", icon: Map },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
    { id: "logs" as Tab, label: "Logs", icon: Activity },
    { id: "cache" as Tab, label: "Cache", icon: Database },
  ];

  const Pagination = ({ pagination, setPagination }: { pagination: PaginationState; setPagination: (p: PaginationState) => void }) => (
    <div className="flex items-center justify-between mt-4 pt-4 border-t">
      <span className="text-sm text-muted-foreground">
        Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
        <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{editingUser ? "Edit User" : "Create User"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} disabled={!!editingUser} />
              </div>
              <div className="space-y-2">
                <Label>{editingUser ? "New Password (leave empty to keep current)" : "Password"}</Label>
                <Input 
                  type="password" 
                  value={userForm.password} 
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} 
                  placeholder={editingUser ? "Enter new password to change..." : "Password"}
                />
                {userForm.password && (
                  <p className="text-xs text-muted-foreground">
                    Password must contain: uppercase, lowercase, number or special character, min 8 chars
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="w-full h-10 rounded-md border px-3">
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select value={userForm.isActive ? "active" : "inactive"} onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === "active" })} className="w-full h-10 rounded-md border px-3">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={saveUser} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setShowUserModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mindmap Modal */}
      {showMindmapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Mindmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={mindmapForm.title} onChange={(e) => setMindmapForm({ ...mindmapForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={mindmapForm.description} onChange={(e) => setMindmapForm({ ...mindmapForm, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <select value={mindmapForm.visibility} onChange={(e) => setMindmapForm({ ...mindmapForm, visibility: e.target.value })} className="w-full h-10 rounded-md border px-3">
                  <option value="PRIVATE">Private</option>
                  <option value="PUBLIC">Public</option>
                  <option value="SHARED">Shared</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={saveMindmap} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setShowMindmapModal(false)} className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 space-y-2">
            {tabs.map((tab) => (
              <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} className="w-full justify-start" onClick={() => setActiveTab(tab.id)}>
                <tab.icon className="h-4 w-4 mr-2" />{tab.label}
              </Button>
            ))}
          </aside>

          {/* Content */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Dashboard Tab */}
                {activeTab === "dashboard" && dashboardData && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Dashboard</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card><CardHeader className="pb-2"><CardDescription>Total Users</CardDescription><CardTitle className="text-3xl">{dashboardData.stats?.totalUsers || 0}</CardTitle></CardHeader></Card>
                      <Card><CardHeader className="pb-2"><CardDescription>Active Users</CardDescription><CardTitle className="text-3xl">{dashboardData.stats?.activeUsers || 0}</CardTitle></CardHeader></Card>
                      <Card><CardHeader className="pb-2"><CardDescription>Total Mindmaps</CardDescription><CardTitle className="text-3xl">{dashboardData.stats?.totalMindmaps || 0}</CardTitle></CardHeader></Card>
                      <Card><CardHeader className="pb-2"><CardDescription>Public Mindmaps</CardDescription><CardTitle className="text-3xl">{dashboardData.stats?.publicMindmaps || 0}</CardTitle></CardHeader></Card>
                    </div>
                    <Card>
                      <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {dashboardData.recentLogs?.slice(0, 10).map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div><span className="font-medium">{log.action}</span><span className="text-muted-foreground mx-2">•</span><span className="text-sm text-muted-foreground">{log.entity}</span></div>
                              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === "users" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Users</h2>
                      <Button onClick={() => openUserModal()}><Plus className="h-4 w-4 mr-2" />Add User</Button>
                    </div>
                    {/* Filters */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-4 items-end">
                          <div className="flex-1 min-w-[200px] space-y-1">
                            <Label className="text-xs">Search</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Email or name..." className="pl-9" value={userFilter.search} onChange={(e) => setUserFilter({ ...userFilter, search: e.target.value })} onKeyDown={(e) => e.key === "Enter" && applyFilter()} />
                            </div>
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className="text-xs">Role</Label>
                            <select value={userFilter.role} onChange={(e) => setUserFilter({ ...userFilter, role: e.target.value })} className="w-full h-10 rounded-md border px-3">
                              <option value="">All</option>
                              <option value="USER">User</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className="text-xs">Status</Label>
                            <select value={userFilter.status} onChange={(e) => setUserFilter({ ...userFilter, status: e.target.value })} className="w-full h-10 rounded-md border px-3">
                              <option value="">All</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                          <Button variant="outline" onClick={applyFilter}><Filter className="h-4 w-4 mr-2" />Filter</Button>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Table */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Email</th>
                                <th className="text-left py-2 px-4">Name</th>
                                <th className="text-left py-2 px-4">Role</th>
                                <th className="text-left py-2 px-4">Status</th>
                                <th className="text-left py-2 px-4">Mindmaps</th>
                                <th className="text-left py-2 px-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((u: any) => (
                                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="py-2 px-4">{u.email}</td>
                                  <td className="py-2 px-4">{u.firstName} {u.lastName}</td>
                                  <td className="py-2 px-4"><span className={`px-2 py-1 rounded text-xs ${u.role === "ADMIN" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{u.role}</span></td>
                                  <td className="py-2 px-4"><span className={`px-2 py-1 rounded text-xs ${u.isActive ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                                  <td className="py-2 px-4">{u._count?.mindmaps || 0}</td>
                                  <td className="py-2 px-4">
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => openUserModal(u)}><Edit className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" onClick={() => deleteUser(u.id)} disabled={u.id === user?.id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {users.length > 0 && <Pagination pagination={usersPagination} setPagination={setUsersPagination} />}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Mindmaps Tab */}
                {activeTab === "mindmaps" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Mindmaps</h2>
                    {/* Filters */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-4 items-end">
                          <div className="flex-1 min-w-[200px] space-y-1">
                            <Label className="text-xs">Search</Label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="Title..." className="pl-9" value={mindmapFilter.search} onChange={(e) => setMindmapFilter({ ...mindmapFilter, search: e.target.value })} onKeyDown={(e) => e.key === "Enter" && applyFilter()} />
                            </div>
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className="text-xs">Visibility</Label>
                            <select value={mindmapFilter.visibility} onChange={(e) => setMindmapFilter({ ...mindmapFilter, visibility: e.target.value })} className="w-full h-10 rounded-md border px-3">
                              <option value="">All</option>
                              <option value="PRIVATE">Private</option>
                              <option value="PUBLIC">Public</option>
                              <option value="SHARED">Shared</option>
                            </select>
                          </div>
                          <Button variant="outline" onClick={applyFilter}><Filter className="h-4 w-4 mr-2" />Filter</Button>
                        </div>
                      </CardContent>
                    </Card>
                    {/* Table */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Title</th>
                                <th className="text-left py-2 px-4">Owner</th>
                                <th className="text-left py-2 px-4">Visibility</th>
                                <th className="text-left py-2 px-4">Nodes</th>
                                <th className="text-left py-2 px-4">Created</th>
                                <th className="text-left py-2 px-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mindmaps.map((m: any) => (
                                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                                  <td className="py-2 px-4 font-medium">{m.title}</td>
                                  <td className="py-2 px-4 text-sm text-muted-foreground">{m.user?.email || "N/A"}</td>
                                  <td className="py-2 px-4"><span className={`px-2 py-1 rounded text-xs ${m.visibility === "PUBLIC" ? "bg-green-100 text-green-800" : m.visibility === "SHARED" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{m.visibility}</span></td>
                                  <td className="py-2 px-4">{m.data?.nodes?.length || 0}</td>
                                  <td className="py-2 px-4 text-sm text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</td>
                                  <td className="py-2 px-4">
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => router.push(`/admin/mindmap/${m.id}`)}><Eye className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" onClick={() => openMindmapModal(m)}><Edit className="h-4 w-4" /></Button>
                                      <Button variant="ghost" size="icon" onClick={() => deleteMindmap(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {mindmaps.length > 0 && <Pagination pagination={mindmapsPagination} setPagination={setMindmapsPagination} />}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Settings</h2>
                    
                    {/* General Settings */}
                    <Card>
                      <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>App Name</Label>
                            <Input value={settings.general_settings?.appName || ""} onChange={(e) => setSettings({ ...settings, general_settings: { ...settings.general_settings, appName: e.target.value } })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Max Mindmaps Per User</Label>
                            <Input type="number" value={settings.general_settings?.maxMindmapsPerUser || 100} onChange={(e) => setSettings({ ...settings, general_settings: { ...settings.general_settings, maxMindmapsPerUser: parseInt(e.target.value) } })} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Label>Allow Public Registration</Label>
                          <input type="checkbox" checked={settings.general_settings?.allowRegistration !== false} onChange={(e) => setSettings({ ...settings, general_settings: { ...settings.general_settings, allowRegistration: e.target.checked } })} className="h-4 w-4" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* reCAPTCHA Settings */}
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />reCAPTCHA Settings</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label>Enable reCAPTCHA</Label>
                          <input type="checkbox" checked={settings.recaptcha_enabled?.enabled || false} onChange={(e) => setSettings({ ...settings, recaptcha_enabled: { ...settings.recaptcha_enabled, enabled: e.target.checked } })} className="h-4 w-4" />
                        </div>
                        {settings.recaptcha_enabled?.enabled && (
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2">
                              <Label>reCAPTCHA Site Key</Label>
                              <Input placeholder="6Le..." value={settings.recaptcha_settings?.siteKey || ""} onChange={(e) => setSettings({ ...settings, recaptcha_settings: { ...settings.recaptcha_settings, siteKey: e.target.value } })} />
                            </div>
                            <div className="space-y-2">
                              <Label>reCAPTCHA Secret Key</Label>
                              <Input type="password" placeholder="6Le..." value={settings.recaptcha_settings?.secretKey || ""} onChange={(e) => setSettings({ ...settings, recaptcha_settings: { ...settings.recaptcha_settings, secretKey: e.target.value } })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label>Apply reCAPTCHA on</Label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.recaptcha_settings?.onLogin !== false} onChange={(e) => setSettings({ ...settings, recaptcha_settings: { ...settings.recaptcha_settings, onLogin: e.target.checked } })} className="h-4 w-4" /><span>Login</span></label>
                                <label className="flex items-center gap-2"><input type="checkbox" checked={settings.recaptcha_settings?.onRegister !== false} onChange={(e) => setSettings({ ...settings, recaptcha_settings: { ...settings.recaptcha_settings, onRegister: e.target.checked } })} className="h-4 w-4" /><span>Registration</span></label>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* SMTP Settings */}
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />SMTP Settings</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label>Enable Email</Label>
                          <input type="checkbox" checked={settings.smtp_enabled?.enabled || false} onChange={(e) => setSettings({ ...settings, smtp_enabled: { enabled: e.target.checked } })} className="h-4 w-4" />
                        </div>
                        {settings.smtp_enabled?.enabled && (
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div className="space-y-2"><Label>SMTP Host</Label><Input value={settings.smtp_settings?.host || ""} onChange={(e) => setSettings({ ...settings, smtp_settings: { ...settings.smtp_settings, host: e.target.value } })} /></div>
                            <div className="space-y-2"><Label>SMTP Port</Label><Input type="number" value={settings.smtp_settings?.port || 587} onChange={(e) => setSettings({ ...settings, smtp_settings: { ...settings.smtp_settings, port: parseInt(e.target.value) } })} /></div>
                            <div className="space-y-2"><Label>SMTP User</Label><Input value={settings.smtp_settings?.user || ""} onChange={(e) => setSettings({ ...settings, smtp_settings: { ...settings.smtp_settings, user: e.target.value } })} /></div>
                            <div className="space-y-2"><Label>SMTP Password</Label><Input type="password" value={settings.smtp_settings?.password || ""} onChange={(e) => setSettings({ ...settings, smtp_settings: { ...settings.smtp_settings, password: e.target.value } })} /></div>
                            <div className="space-y-2"><Label>From Email</Label><Input value={settings.smtp_settings?.from || ""} onChange={(e) => setSettings({ ...settings, smtp_settings: { ...settings.smtp_settings, from: e.target.value } })} /></div>
                            <div className="space-y-2 flex items-center gap-4 pt-6"><Label>Secure (TLS)</Label><input type="checkbox" checked={settings.smtp_settings?.secure || false} onChange={(e) => setSettings({ ...settings, smtp_settings: { ...settings.smtp_settings, secure: e.target.checked } })} className="h-4 w-4" /></div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Cache Settings */}
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Cache Settings</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Label>Enable Caching</Label>
                          <input type="checkbox" checked={settings.cache_enabled?.enabled !== false} onChange={(e) => setSettings({ ...settings, cache_enabled: { enabled: e.target.checked } })} className="h-4 w-4" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Cache TTL (seconds)</Label>
                            <Input type="number" value={settings.cache_settings?.ttl || 3600} onChange={(e) => setSettings({ ...settings, cache_settings: { ...settings.cache_settings, ttl: parseInt(e.target.value) } })} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Button onClick={updateSettings} size="lg">Save All Settings</Button>
                  </div>
                )}

                {/* Logs Tab */}
                {activeTab === "logs" && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Activity Logs</h2>
                    {/* Filters */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex flex-wrap gap-4 items-end">
                          <div className="w-40 space-y-1">
                            <Label className="text-xs">Action</Label>
                            <select value={logFilter.action} onChange={(e) => setLogFilter({ ...logFilter, action: e.target.value })} className="w-full h-10 rounded-md border px-3">
                              <option value="">All</option>
                              <option value="CREATE">Create</option>
                              <option value="UPDATE">Update</option>
                              <option value="DELETE">Delete</option>
                              <option value="LOGIN">Login</option>
                              <option value="LOGOUT">Logout</option>
                            </select>
                          </div>
                          <div className="w-40 space-y-1">
                            <Label className="text-xs">Entity</Label>
                            <select value={logFilter.entity} onChange={(e) => setLogFilter({ ...logFilter, entity: e.target.value })} className="w-full h-10 rounded-md border px-3">
                              <option value="">All</option>
                              <option value="USER">User</option>
                              <option value="MINDMAP">Mindmap</option>
                              <option value="SETTINGS">Settings</option>
                            </select>
                          </div>
                          <Button variant="outline" onClick={applyFilter}><Filter className="h-4 w-4 mr-2" />Filter</Button>
                          <Button variant="ghost" onClick={() => loadData()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          {logs.map((log: any) => (
                            <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-0">
                              <div className="flex items-center gap-4">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <span className={`font-medium px-2 py-0.5 rounded text-xs ${log.action === "DELETE" ? "bg-red-100 text-red-800" : log.action === "CREATE" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{log.action}</span>
                                  <span className="text-muted-foreground mx-2">•</span>
                                  <span className="text-sm text-muted-foreground">{log.entity}</span>
                                  {log.user && (<><span className="text-muted-foreground mx-2">•</span><span className="text-sm">{log.user.email}</span></>)}
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        {logs.length > 0 && <Pagination pagination={logsPagination} setPagination={setLogsPagination} />}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Cache Tab */}
                {activeTab === "cache" && cache && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Cache Management</h2>
                    <Card>
                      <CardHeader><CardTitle>Cache Statistics</CardTitle><CardDescription>Total cached keys: {cache.totalKeys}</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-4">
                          <Button variant="destructive" onClick={() => clearCache()}>Clear All Cache</Button>
                          <Button variant="outline" onClick={() => clearCache("mindmap:*")}>Clear Mindmap Cache</Button>
                          <Button variant="outline" onClick={() => clearCache("user:*")}>Clear User Cache</Button>
                          <Button variant="outline" onClick={() => clearCache("settings:*")}>Clear Settings Cache</Button>
                        </div>
                        {cache.keys?.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Cached Keys (first 100):</h4>
                            <div className="bg-muted p-4 rounded-lg max-h-64 overflow-auto">
                              <pre className="text-sm">{cache.keys.join("\n")}</pre>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
