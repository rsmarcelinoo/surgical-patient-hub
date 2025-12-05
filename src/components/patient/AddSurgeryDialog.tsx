import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddSurgeryDialogProps {
  patientId: string;
  trigger?: React.ReactNode;
}

export function AddSurgeryDialog({ patientId, trigger }: AddSurgeryDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    procedure_name: "",
    scheduled_date: "",
    status: "scheduled",
    main_surgeon: "",
    assistants: "",
    operating_room: "",
    duration_minutes: "",
    structured_description: "",
    notes: "",
    episode_id: "",
  });

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

  const addSurgeryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("surgeries").insert({
        patient_id: patientId,
        procedure_name: data.procedure_name,
        scheduled_date: data.scheduled_date || null,
        status: data.status,
        main_surgeon: data.main_surgeon || null,
        assistants: data.assistants ? data.assistants.split(",").map((s) => s.trim()) : null,
        operating_room: data.operating_room || null,
        duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
        structured_description: data.structured_description || null,
        notes: data.notes || null,
        episode_id: data.episode_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-surgeries", patientId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setOpen(false);
      setFormData({
        procedure_name: "",
        scheduled_date: "",
        status: "scheduled",
        main_surgeon: "",
        assistants: "",
        operating_room: "",
        duration_minutes: "",
        structured_description: "",
        notes: "",
        episode_id: "",
      });
      toast.success("Surgery added successfully");
    },
    onError: () => {
      toast.error("Failed to add surgery");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.procedure_name.trim()) {
      toast.error("Procedure name is required");
      return;
    }
    addSurgeryMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Surgery
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Surgery</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="procedure">Procedure Name *</Label>
            <Input
              id="procedure"
              value={formData.procedure_name}
              onChange={(e) => setFormData({ ...formData, procedure_name: e.target.value })}
              placeholder="e.g., Laparoscopic Cholecystectomy"
              required
            />
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
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {episodes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="episode">Link to Episode (optional)</Label>
              <Select
                value={formData.episode_id}
                onValueChange={(value) => setFormData({ ...formData, episode_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an episode" />
                </SelectTrigger>
                <SelectContent>
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
                placeholder="Dr. Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room">Operating Room</Label>
              <Input
                id="room"
                value={formData.operating_room}
                onChange={(e) => setFormData({ ...formData, operating_room: e.target.value })}
                placeholder="OR-1"
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
                placeholder="Dr. Jones, Dr. Brown"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="120"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.structured_description}
              onChange={(e) => setFormData({ ...formData, structured_description: e.target.value })}
              placeholder="Detailed procedure description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={addSurgeryMutation.isPending}>
            {addSurgeryMutation.isPending ? "Adding..." : "Add Surgery"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
