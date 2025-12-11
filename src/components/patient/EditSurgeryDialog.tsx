/**
 * EditSurgeryDialog Component
 * 
 * Dialog for editing surgery details.
 */

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

interface EditSurgeryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surgeryId: string;
  patientId: string;
}

export function EditSurgeryDialog({ open, onOpenChange, surgeryId, patientId }: EditSurgeryDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    procedure_name: "",
    scheduled_date: "",
    status: "scheduled",
    hospital_id: "",
    main_surgeon: "",
    assistants: "",
    operating_room: "",
    duration_minutes: "",
    structured_description: "",
    notes: "",
    episode_id: "",
  });

  // Fetch surgery data
  const { data: surgery } = useQuery({
    queryKey: ["surgery-detail", surgeryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*")
        .eq("id", surgeryId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!surgeryId,
  });

  // Fetch hospitals
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch episodes
  const { data: episodes = [] } = useQuery({
    queryKey: ["patient-episodes-list", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("id, title")
        .eq("patient_id", patientId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (surgery) {
      setFormData({
        procedure_name: surgery.procedure_name || "",
        scheduled_date: surgery.scheduled_date ? surgery.scheduled_date.slice(0, 16) : "",
        status: surgery.status || "scheduled",
        hospital_id: surgery.hospital_id || "",
        main_surgeon: surgery.main_surgeon || "",
        assistants: surgery.assistants?.join(", ") || "",
        operating_room: surgery.operating_room || "",
        duration_minutes: surgery.duration_minutes?.toString() || "",
        structured_description: surgery.structured_description || "",
        notes: surgery.notes || "",
        episode_id: surgery.episode_id || "",
      });
    }
  }, [surgery]);

  const updateSurgeryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("surgeries")
        .update({
          procedure_name: data.procedure_name,
          scheduled_date: data.scheduled_date || null,
          status: data.status,
          hospital_id: data.hospital_id || null,
          main_surgeon: data.main_surgeon || null,
          assistants: data.assistants ? data.assistants.split(",").map((s) => s.trim()) : null,
          operating_room: data.operating_room || null,
          duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
          structured_description: data.structured_description || null,
          notes: data.notes || null,
          episode_id: data.episode_id || null,
        })
        .eq("id", surgeryId);
      if (error) throw error;

      // Update kanban card column to match surgery status
      const statusToColumn: Record<string, string> = {
        scheduled: "scheduled",
        pending: "pending",
        in_progress: "pending",
        completed: "operated",
        cancelled: "waiting",
      };
      
      const newColumn = statusToColumn[data.status] || "scheduled";
      
      await supabase
        .from("kanban_cards")
        .update({ 
          column_name: newColumn,
          scheduled_date: data.scheduled_date || null,
        })
        .eq("patient_id", patientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-card-surgeries", patientId] });
      queryClient.invalidateQueries({ queryKey: ["surgery-detail", surgeryId] });
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      onOpenChange(false);
      toast.success("Surgery updated successfully");
    },
    onError: () => {
      toast.error("Failed to update surgery");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.procedure_name.trim()) {
      toast.error("Procedure name is required");
      return;
    }
    updateSurgeryMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Surgery</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedure Name *</Label>
            <Input
              id="procedure"
              value={formData.procedure_name}
              onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hospital">Hospital</Label>
            <Select
              value={formData.hospital_id}
              onValueChange={(value) => setFormData({ ...formData, hospital_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select hospital" />
              </SelectTrigger>
              <SelectContent>
                {hospitals.map((hospital) => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Scheduled Date</Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {episodes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="episode">Link to Episode</Label>
              <Select
                value={formData.episode_id}
                onValueChange={(value) => setFormData({ ...formData, episode_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an episode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {episodes.map((episode) => (
                    <SelectItem key={episode.id} value={episode.id}>
                      {episode.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="surgeon">Main Surgeon</Label>
              <Input
                id="surgeon"
                value={formData.main_surgeon}
                onChange={(e) => setFormData({ ...formData, main_surgeon: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Operating Room</Label>
              <Input
                id="room"
                value={formData.operating_room}
                onChange={(e) => setFormData({ ...formData, operating_room: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assistants">Assistants</Label>
              <Input
                id="assistants"
                value={formData.assistants}
                onChange={(e) => setFormData({ ...formData, assistants: e.target.value })}
                placeholder="Comma separated"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.structured_description}
              onChange={(e) => setFormData({ ...formData, structured_description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={updateSurgeryMutation.isPending}>
            {updateSurgeryMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
