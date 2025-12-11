/**
 * CreatePatientInKanban Component
 * 
 * Inline form for creating a new patient directly from the kanban board.
 * After creation, automatically adds the patient to the board.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface CreatePatientInKanbanProps {
  boardId: string;
  columnId: string;
  position: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreatePatientInKanban({
  boardId,
  columnId,
  position,
  onSuccess,
  onCancel,
}: CreatePatientInKanbanProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [mrn, setMrn] = useState("");
  const [surgeryType, setSurgeryType] = useState("");
  const [priority, setPriority] = useState("normal");

  const createPatientMutation = useMutation({
    mutationFn: async () => {
      // Create patient
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .insert({
          name,
          medical_record_number: mrn || null,
        })
        .select("id")
        .single();

      if (patientError) throw patientError;

      // Create kanban card
      const { error: cardError } = await supabase.from("kanban_cards").insert({
        board_id: boardId,
        patient_id: patient.id,
        column_name: columnId,
        position,
        surgery_type: surgeryType || null,
        priority,
      });

      if (cardError) throw cardError;

      return patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards", boardId] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.invalidateQueries({ queryKey: ["patients-list"] });
      toast.success("Patient created and added to board");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Failed to create patient: " + error.message);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Patient name is required");
      return;
    }
    createPatientMutation.mutate();
  };

  return (
    <div className="bg-card rounded-lg border p-3 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <UserPlus className="h-4 w-4" />
        New Patient
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Patient name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Input
          placeholder="Medical Record # (optional)"
          value={mrn}
          onChange={(e) => setMrn(e.target.value)}
        />
        <Input
          placeholder="Surgery type (optional)"
          value={surgeryType}
          onChange={(e) => setSurgeryType(e.target.value)}
        />
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={createPatientMutation.isPending}
          className="flex-1"
        >
          {createPatientMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Create"
          )}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}