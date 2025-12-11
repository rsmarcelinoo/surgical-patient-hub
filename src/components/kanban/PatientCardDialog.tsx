/**
 * PatientCardDialog Component
 * 
 * A comprehensive dialog for viewing and managing patient details in the Kanban board.
 * Features: surgeries, tags, checklist, files, comments, description editing.
 * Similar to ClickUp card view.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Tag,
  CheckSquare,
  Paperclip,
  Calendar,
  User,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit,
  X,
  Clock,
  Flag,
  ExternalLink,
  Save,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AddSurgeryDialog } from "@/components/patient/AddSurgeryDialog";
import { FileUpload } from "@/components/patient/FileUpload";
import { EditPatientDialog } from "@/components/patient/EditPatientDialog";
import { EditSurgeryDialog } from "@/components/patient/EditSurgeryDialog";

interface PatientCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardId: string;
  patientId: string;
  columnName: string;
  boardId: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

const priorityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  urgent: { label: "Urgent", color: "text-red-600", bgColor: "bg-red-100" },
  high: { label: "High", color: "text-orange-600", bgColor: "bg-orange-100" },
  normal: { label: "Normal", color: "text-amber-600", bgColor: "bg-amber-100" },
  low: { label: "Low", color: "text-green-600", bgColor: "bg-green-100" },
};

export function PatientCardDialog({
  open,
  onOpenChange,
  cardId,
  patientId,
  columnName,
  boardId,
}: PatientCardDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const [deletePatientOpen, setDeletePatientOpen] = useState(false);
  const [deleteSurgeryId, setDeleteSurgeryId] = useState<string | null>(null);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [editSurgeryId, setEditSurgeryId] = useState<string | null>(null);

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient-card-detail", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single();
      if (error) throw error;
      setDescription(data.notes || "");
      return data;
    },
    enabled: open && !!patientId,
  });

  // Fetch card data
  const { data: card } = useQuery({
    queryKey: ["kanban-card-detail", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_cards")
        .select("*")
        .eq("id", cardId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!cardId,
  });

  // Fetch surgeries
  const { data: surgeries = [] } = useQuery({
    queryKey: ["patient-card-surgeries", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*, hospital:hospitals(name)")
        .eq("patient_id", patientId)
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!patientId,
  });

  // Fetch attachments
  const { data: attachments = [] } = useQuery({
    queryKey: ["patient-card-attachments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("patient_id", patientId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!patientId,
  });

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ["patient-card-comments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!patientId,
  });

  // Parse checklist from card notes (stored as JSON)
  const checklist: ChecklistItem[] = card?.notes ? 
    (() => {
      try {
        return JSON.parse(card.notes);
      } catch {
        return [];
      }
    })() : [];

  // Update patient description
  const updateDescriptionMutation = useMutation({
    mutationFn: async (notes: string) => {
      const { error } = await supabase
        .from("patients")
        .update({ notes })
        .eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-card-detail", patientId] });
      setIsEditingDescription(false);
      toast.success("Description saved");
    },
  });

  // Update card priority
  const updatePriorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const { error } = await supabase
        .from("kanban_cards")
        .update({ priority })
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards", boardId] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card-detail", cardId] });
      toast.success("Priority updated");
    },
  });

  // Update checklist
  const updateChecklistMutation = useMutation({
    mutationFn: async (items: ChecklistItem[]) => {
      const { error } = await supabase
        .from("kanban_cards")
        .update({ notes: JSON.stringify(items) })
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-card-detail", cardId] });
    },
  });

  // Delete patient
  const deletePatientMutation = useMutation({
    mutationFn: async () => {
      // Delete related records first
      await supabase.from("kanban_cards").delete().eq("patient_id", patientId);
      await supabase.from("comments").delete().eq("patient_id", patientId);
      await supabase.from("attachments").delete().eq("patient_id", patientId);
      await supabase.from("consultations").delete().eq("patient_id", patientId);
      await supabase.from("surgeries").delete().eq("patient_id", patientId);
      await supabase.from("episodes").delete().eq("patient_id", patientId);
      
      const { error } = await supabase.from("patients").delete().eq("id", patientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      onOpenChange(false);
      toast.success("Patient deleted");
    },
    onError: () => {
      toast.error("Failed to delete patient");
    },
  });

  // Delete surgery
  const deleteSurgeryMutation = useMutation({
    mutationFn: async (surgeryId: string) => {
      const { error } = await supabase.from("surgeries").delete().eq("id", surgeryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-card-surgeries", patientId] });
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      setDeleteSurgeryId(null);
      toast.success("Surgery deleted");
    },
  });

  // Add comment
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("comments").insert({
        patient_id: patientId,
        text,
        author: "User",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-card-comments", patientId] });
    },
  });

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: newChecklistItem,
      completed: false,
    };
    updateChecklistMutation.mutate([...checklist, newItem]);
    setNewChecklistItem("");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updated = checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updateChecklistMutation.mutate(updated);
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    const updated = checklist.filter((item) => item.id !== itemId);
    updateChecklistMutation.mutate(updated);
  };

  const [commentText, setCommentText] = useState("");

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText);
    setCommentText("");
  };

  if (patientLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <div className="animate-pulse space-y-4 p-4">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusColors: Record<string, string> = {
    scheduled: "bg-warning/10 text-warning border-warning",
    pending: "bg-orange-100 text-orange-700 border-orange-300",
    completed: "bg-success/10 text-success border-success",
    cancelled: "bg-destructive/10 text-destructive border-destructive",
    in_progress: "bg-info/10 text-info border-info",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="uppercase text-xs">
                {columnName}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/patient/${patientId}`)}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Full Details
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditPatientOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Patient
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeletePatientOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Patient
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Patient Name & MRN */}
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-3">
                  {patient?.name}
                  {patient?.medical_record_number && (
                    <span className="text-lg text-muted-foreground font-normal">
                      {patient.medical_record_number}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {patient?.gender && <span>{patient.gender}</span>}
                  {patient?.date_of_birth && (
                    <span>DOB: {format(new Date(patient.date_of_birth), "dd/MM/yyyy")}</span>
                  )}
                  {patient?.contact_phone && <span>Tel: {patient.contact_phone}</span>}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap">
                <AddSurgeryDialog
                  patientId={patientId}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Surgery
                    </Button>
                  }
                />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Tag className="h-4 w-4 mr-1" />
                      Priority
                      {card?.priority && (
                        <Badge className={cn("ml-2", priorityConfig[card.priority]?.bgColor, priorityConfig[card.priority]?.color)}>
                          {priorityConfig[card.priority]?.label}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => updatePriorityMutation.mutate(key)}
                      >
                        <Badge className={cn(config.bgColor, config.color)}>{config.label}</Badge>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChecklist(!showChecklist)}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Checklist
                  {checklist.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {checklist.filter((i) => i.completed).length}/{checklist.length}
                    </Badge>
                  )}
                </Button>

                <FileUpload
                  patientId={patientId}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                      {attachments.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{attachments.length}</Badge>
                      )}
                    </Button>
                  }
                />
              </div>

              {/* Scheduled Date */}
              {card?.scheduled_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Scheduled: {format(new Date(card.scheduled_date), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
              )}

              {/* Checklist Section */}
              {showChecklist && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Checklist
                  </h3>
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => handleToggleChecklistItem(item.id)}
                        />
                        <span className={cn("flex-1", item.completed && "line-through text-muted-foreground")}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleAddChecklistItem}>
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Description</h3>
                  {!isEditingDescription && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingDescription(true)}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={4}
                      className="bg-muted/50"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => updateDescriptionMutation.mutate(description)}>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsEditingDescription(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="min-h-[100px] p-3 bg-muted/50 rounded-lg text-sm cursor-pointer hover:bg-muted/70"
                    onClick={() => setIsEditingDescription(true)}
                  >
                    {description || <span className="text-muted-foreground">Click to add description...</span>}
                  </div>
                )}
              </div>

              {/* Surgeries */}
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Surgeries ({surgeries.length})
                </h3>
                {surgeries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No surgeries scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {surgeries.map((surgery) => (
                      <div
                        key={surgery.id}
                        className="border rounded-lg p-3 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{surgery.procedure_name}</span>
                              <Badge className={cn("text-xs", statusColors[surgery.status])}>
                                {surgery.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {surgery.scheduled_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(surgery.scheduled_date), "dd/MM/yyyy HH:mm")}
                                </span>
                              )}
                              {surgery.hospital && (
                                <span>{(surgery.hospital as { name: string }).name}</span>
                              )}
                            </div>
                            {(surgery.main_surgeon || surgery.surgeon) && (
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                <span>{surgery.main_surgeon || surgery.surgeon}</span>
                              </div>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditSurgeryId(surgery.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Surgery
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteSurgeryId(surgery.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Surgery
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments ({attachments.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {attachments.slice(0, 6).map((att) => (
                      <div
                        key={att.id}
                        className="border rounded-lg p-2 text-xs truncate hover:bg-muted/30 cursor-pointer"
                        title={att.file_name}
                      >
                        <Paperclip className="h-3 w-3 inline mr-1" />
                        {att.file_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Comments & Activity */}
            <div className="w-80 border-l bg-muted/20 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Comments & Activity
                </h3>
              </div>

              {/* Add Comment */}
              <div className="p-4 border-b">
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    {commentText && (
                      <Button size="sm" onClick={handleAddComment}>
                        Post
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-medium">
                            {(comment.author || "U")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{comment.author || "User"}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), "dd MMM, HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm pl-8">{comment.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Confirmation */}
      <AlertDialog open={deletePatientOpen} onOpenChange={setDeletePatientOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {patient?.name} and all associated records (surgeries, episodes, consultations, comments, attachments). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletePatientMutation.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Surgery Confirmation */}
      <AlertDialog open={!!deleteSurgeryId} onOpenChange={() => setDeleteSurgeryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Surgery?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this surgery record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteSurgeryId && deleteSurgeryMutation.mutate(deleteSurgeryId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Patient Dialog */}
      {patient && (
        <EditPatientDialog
          open={editPatientOpen}
          onOpenChange={setEditPatientOpen}
          patient={patient}
        />
      )}

      {/* Edit Surgery Dialog */}
      {editSurgeryId && (
        <EditSurgeryDialog
          open={!!editSurgeryId}
          onOpenChange={() => setEditSurgeryId(null)}
          surgeryId={editSurgeryId}
          patientId={patientId}
        />
      )}
    </>
  );
}
