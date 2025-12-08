/**
 * AppSidebar Component
 * 
 * Main sidebar navigation for the application.
 * Provides access to all major views: Dashboard, Kanban boards, Calendar, List view.
 * Also includes hospital management and filters.
 * 
 * Features:
 * - Dashboard navigation
 * - Dynamic Kanban board links based on available boards
 * - Calendar and List view navigation
 * - Hospital management (add new hospitals)
 * - Filter controls for date, urgency, hospital, and tags
 */

import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  List,
  Building2,
  Plus,
  ChevronDown,
  Settings,
  Scissors,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const queryClient = useQueryClient();
  
  // State for hospital dialog
  const [hospitalDialogOpen, setHospitalDialogOpen] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState("");
  const [newHospitalCode, setNewHospitalCode] = useState("");
  
  // State for collapsible groups
  const [boardsOpen, setBoardsOpen] = useState(true);
  const [hospitalsOpen, setHospitalsOpen] = useState(false);

  /**
   * Fetch all kanban boards for navigation
   */
  const { data: boards = [] } = useQuery({
    queryKey: ["kanban-boards-nav"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .select("id, name, hospital:hospitals(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  /**
   * Fetch all hospitals for management
   */
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  /**
   * Mutation to add a new hospital
   */
  const addHospitalMutation = useMutation({
    mutationFn: async ({ name, code }: { name: string; code: string }) => {
      const { error } = await supabase
        .from("hospitals")
        .insert({ name, code: code || null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitals-list"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-boards-nav"] });
      setHospitalDialogOpen(false);
      setNewHospitalName("");
      setNewHospitalCode("");
      toast.success("Hospital added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add hospital: " + error.message);
    },
  });

  /**
   * Handle adding a new hospital
   */
  const handleAddHospital = () => {
    if (!newHospitalName.trim()) {
      toast.error("Hospital name is required");
      return;
    }
    addHospitalMutation.mutate({
      name: newHospitalName.trim(),
      code: newHospitalCode.trim(),
    });
  };

  /**
   * Check if a path is currently active
   */
  const isActive = (path: string) => location.pathname === path;
  const isKanbanActive = location.pathname.startsWith("/kanban");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="text-sm font-medium text-sidebar-foreground">
            Navigation
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/")}>
                  <Link to="/">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Calendar View */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/calendar")}>
                  <Link to="/calendar">
                    <Calendar className="h-4 w-4" />
                    {!collapsed && <span>Calendar</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* List View */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/list")}>
                  <Link to="/list">
                    <List className="h-4 w-4" />
                    {!collapsed && <span>Patients</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Surgeries View */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname.startsWith("/surgeries")}>
                  <Link to="/surgeries">
                    <Scissors className="h-4 w-4" />
                    {!collapsed && <span>Surgeries</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Kanban Boards */}
        <SidebarGroup>
          <Collapsible open={boardsOpen} onOpenChange={setBoardsOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Kanban className="h-4 w-4" />
                  {!collapsed && <span>Kanban Boards</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    boardsOpen && "rotate-180"
                  )} />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {boards.length === 0 ? (
                    <SidebarMenuItem>
                      <SidebarMenuButton disabled>
                        {!collapsed && <span className="text-muted-foreground text-sm">No boards</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ) : (
                    boards.map((board) => (
                      <SidebarMenuItem key={board.id}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={location.pathname === `/kanban/${board.id}`}
                        >
                          <Link to={`/kanban/${board.id}`}>
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            {!collapsed && (
                              <div className="flex flex-col">
                                <span className="text-sm">{board.name}</span>
                                {board.hospital && (
                                  <span className="text-xs text-muted-foreground">
                                    {(board.hospital as { name: string }).name}
                                  </span>
                                )}
                              </div>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Hospitals Management */}
        <SidebarGroup>
          <Collapsible open={hospitalsOpen} onOpenChange={setHospitalsOpen}>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer hover:bg-sidebar-accent rounded-md px-2 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {!collapsed && <span>Hospitals</span>}
                </div>
                {!collapsed && (
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    hospitalsOpen && "rotate-180"
                  )} />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {hospitals.map((hospital) => (
                    <SidebarMenuItem key={hospital.id}>
                      <SidebarMenuButton>
                        <div className="w-2 h-2 rounded-full bg-success" />
                        {!collapsed && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{hospital.name}</span>
                            {hospital.code && (
                              <Badge variant="outline" className="text-xs">
                                {hospital.code}
                              </Badge>
                            )}
                          </div>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  {/* Add Hospital Button */}
                  <SidebarMenuItem>
                    <Dialog open={hospitalDialogOpen} onOpenChange={setHospitalDialogOpen}>
                      <DialogTrigger asChild>
                        <SidebarMenuButton className="text-primary hover:text-primary">
                          <Plus className="h-4 w-4" />
                          {!collapsed && <span>Add Hospital</span>}
                        </SidebarMenuButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Hospital</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="hospital-name">Hospital Name *</Label>
                            <Input
                              id="hospital-name"
                              value={newHospitalName}
                              onChange={(e) => setNewHospitalName(e.target.value)}
                              placeholder="e.g., Central Hospital"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hospital-code">Hospital Code (optional)</Label>
                            <Input
                              id="hospital-code"
                              value={newHospitalCode}
                              onChange={(e) => setNewHospitalCode(e.target.value)}
                              placeholder="e.g., CH01"
                            />
                          </div>
                          <Button 
                            onClick={handleAddHospital} 
                            className="w-full"
                            disabled={addHospitalMutation.isPending}
                          >
                            {addHospitalMutation.isPending ? "Adding..." : "Add Hospital"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
