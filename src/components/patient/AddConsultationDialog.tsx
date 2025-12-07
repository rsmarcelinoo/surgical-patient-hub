/**
 * AddConsultationDialog Component
 * 
 * Dialog for adding a new consultation to a patient's record.
 * Includes fields for type, date, location, diagnosis, treatment plan, and notes.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

interface AddConsultationDialogProps {
  patientId: string;
  episodeId?: string;
  surgeryId?: string;
  trigger?: React.ReactNode;
}

const consultationTypes = [
  { value: "pre_op", label: "Pre-Op" },
  { value: "post_op", label: "Post-Op" },
  { value: "complication", label: "Complication" },
  { value: "re_intervention", label: "Re-intervention" },
  { value: "exam", label: "Exam" },
  { value: "routine", label: "Routine" },
];

export function AddConsultationDialog({ 
  patientId, 
  episodeId, 
  surgeryId, 
  trigger 
}: AddConsultationDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    consultation_type: "routine",
    consultation_date: new Date().toISOString().slice(0, 16),
    location: "",
    diagnosis: "",
    treatment_plan: "",
    notes: "",
    follow_up_date: "",
  });

  /** Mutation to add consultation */
  const addConsultationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("consultations").insert({
        patient_id: patientId,
        episode_id: episodeId || null,
        surgery_id: surgeryId || null,
        consultation_type: formData.consultation_type,
        consultation_date: formData.consultation_date,
        location: formData.location || null,
        diagnosis: formData.diagnosis || null,
        treatment_plan: formData.treatment_plan || null,
        notes: formData.notes || null,
        follow_up_date: formData.follow_up_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-consultations", patientId] });
      setOpen(false);
      resetForm();
      toast.success("Consultation added successfully");
    },
    onError: (error) => {
      toast.error("Failed to add consultation: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      consultation_type: "routine",
      consultation_date: new Date().toISOString().slice(0, 16),
      location: "",
      diagnosis: "",
      treatment_plan: "",
      notes: "",
      follow_up_date: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addConsultationMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Consultation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Consultation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consultation_type">Type</Label>
              <Select
                value={formData.consultation_type}
                onValueChange={(value) => setFormData({ ...formData, consultation_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {consultationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation_date">Date & Time *</Label>
              <Input
                id="consultation_date"
                type="datetime-local"
                value={formData.consultation_date}
                onChange={(e) => setFormData({ ...formData, consultation_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Consultation Room 3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Enter diagnosis..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="treatment_plan">Treatment Plan</Label>
            <Textarea
              id="treatment_plan"
              value={formData.treatment_plan}
              onChange={(e) => setFormData({ ...formData, treatment_plan: e.target.value })}
              placeholder="Enter treatment plan..."
              rows={2}
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

          <div className="space-y-2">
            <Label htmlFor="follow_up_date">Follow-up Date</Label>
            <Input
              id="follow_up_date"
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full" disabled={addConsultationMutation.isPending}>
            {addConsultationMutation.isPending ? "Adding..." : "Add Consultation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
