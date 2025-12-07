/**
 * AddEpisodeDialog Component
 * 
 * Dialog for adding a new episode to a patient's record.
 * Includes fields for title, type, status, hospital, dates, and description.
 */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddEpisodeDialogProps {
  patientId: string;
  trigger?: React.ReactNode;
}

const episodeTypes = [
  { value: "hospitalization", label: "Hospitalization" },
  { value: "follow_up", label: "Follow-up" },
  { value: "complication", label: "Complication" },
  { value: "outpatient", label: "Outpatient" },
];

const episodeStatuses = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function AddEpisodeDialog({ patientId, trigger }: AddEpisodeDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    episode_type: "hospitalization",
    status: "active",
    hospital_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    description: "",
  });

  /** Fetch hospitals for dropdown */
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

  /** Mutation to add episode */
  const addEpisodeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("episodes").insert({
        patient_id: patientId,
        title: formData.title,
        episode_type: formData.episode_type,
        status: formData.status,
        hospital_id: formData.hospital_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        description: formData.description || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-episodes", patientId] });
      setOpen(false);
      resetForm();
      toast.success("Episode added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add episode: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      episode_type: "hospitalization",
      status: "active",
      hospital_id: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: "",
      description: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }
    addEpisodeMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Episode
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Episode</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Hip Surgery Admission"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="episode_type">Type</Label>
              <Select
                value={formData.episode_type}
                onValueChange={(value) => setFormData({ ...formData, episode_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {episodeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  {episodeStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={addEpisodeMutation.isPending}>
            {addEpisodeMutation.isPending ? "Adding..." : "Add Episode"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
