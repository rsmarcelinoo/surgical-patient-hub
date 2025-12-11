/**
 * ManageBoardDialog Component
 * 
 * Dialog for creating and editing kanban boards.
 * Allows setting name, hospital, service, and description.
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ManageBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Board to edit - if null, creates new board */
  board?: {
    id: string;
    name: string;
    description: string | null;
    hospital_id: string | null;
    service: string | null;
  } | null;
}

export function ManageBoardDialog({ open, onOpenChange, board }: ManageBoardDialogProps) {
  const queryClient = useQueryClient();
  const isEditing = !!board;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hospitalId, setHospitalId] = useState<string>("");
  const [service, setService] = useState("");

  // Reset form when dialog opens/closes or board changes
  useEffect(() => {
    if (open) {
      if (board) {
        setName(board.name);
        setDescription(board.description || "");
        setHospitalId(board.hospital_id || "");
        setService(board.service || "");
      } else {
        setName("");
        setDescription("");
        setHospitalId("");
        setService("");
      }
    }
  }, [open, board]);

  // Fetch hospitals for dropdown
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

  // Create board mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("kanban_boards").insert({
        name,
        description: description || null,
        hospital_id: hospitalId || null,
        service: service || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-boards-nav"] });
      toast.success("Board created successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to create board: " + error.message);
    },
  });

  // Update board mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("kanban_boards")
        .update({
          name,
          description: description || null,
          hospital_id: hospitalId || null,
          service: service || null,
        })
        .eq("id", board!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-boards-nav"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-board", board!.id] });
      toast.success("Board updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update board: " + error.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Board name is required");
      return;
    }
    if (isEditing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Board" : "Create New Board"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="board-name">Board Name *</Label>
            <Input
              id="board-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Surgery Waiting List"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-hospital">Hospital (optional)</Label>
            <Select value={hospitalId} onValueChange={setHospitalId}>
              <SelectTrigger id="board-hospital">
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No hospital</SelectItem>
                {hospitals.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-service">Service (optional)</Label>
            <Input
              id="board-service"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g., Orthopedics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="board-description">Description (optional)</Label>
            <Textarea
              id="board-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this board..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  {isEditing ? "Saving..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Board"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}