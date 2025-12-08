/**
 * Hook to sync surgery status with kanban cards and auto-update overdue surgeries
 * 
 * This hook:
 * 1. Checks for scheduled surgeries where the date has passed
 * 2. Updates them to "pending" status
 * 3. Updates corresponding kanban cards
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mapping between surgery status and kanban column
 */
export const surgeryStatusToKanbanColumn: Record<string, string> = {
  scheduled: "scheduled",
  pending: "pending",
  in_progress: "pending",
  completed: "operated",
  cancelled: "waiting",
};

/**
 * Hook to automatically update overdue surgeries to pending status
 * Runs on mount and updates both surgeries and kanban cards
 */
export function useSurgeryStatusSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const updateOverdueSurgeries = async () => {
      const now = new Date().toISOString();

      // Find scheduled surgeries where the date has passed
      const { data: overdueSurgeries, error: fetchError } = await supabase
        .from("surgeries")
        .select("id, patient_id, status")
        .eq("status", "scheduled")
        .lt("scheduled_date", now);

      if (fetchError || !overdueSurgeries?.length) return;

      // Update surgeries to pending
      const { error: updateError } = await supabase
        .from("surgeries")
        .update({ status: "pending" })
        .in("id", overdueSurgeries.map(s => s.id));

      if (updateError) {
        console.error("Failed to update overdue surgeries:", updateError);
        return;
      }

      // Update kanban cards for affected patients
      const patientIds = [...new Set(overdueSurgeries.map(s => s.patient_id))];
      
      await supabase
        .from("kanban_cards")
        .update({ column_name: "pending" })
        .in("patient_id", patientIds)
        .eq("column_name", "scheduled");

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-surgeries"] });
      queryClient.invalidateQueries({ queryKey: ["pending-surgeries-count"] });
    };

    updateOverdueSurgeries();
  }, [queryClient]);
}

/**
 * Function to sync a patient's kanban card with their next surgery status
 */
export async function syncPatientKanbanWithSurgery(patientId: string) {
  // Get the patient's next upcoming surgery
  const { data: nextSurgery, error } = await supabase
    .from("surgeries")
    .select("status, scheduled_date")
    .eq("patient_id", patientId)
    .not("status", "eq", "completed")
    .not("status", "eq", "cancelled")
    .order("scheduled_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch next surgery:", error);
    return;
  }

  let newColumn = "waiting";
  
  if (nextSurgery) {
    // Check if surgery date has passed
    const surgeryDate = nextSurgery.scheduled_date ? new Date(nextSurgery.scheduled_date) : null;
    const now = new Date();
    
    if (surgeryDate && surgeryDate < now && nextSurgery.status === "scheduled") {
      newColumn = "pending";
    } else {
      newColumn = surgeryStatusToKanbanColumn[nextSurgery.status] || "waiting";
    }
  }

  // Update kanban cards for this patient
  await supabase
    .from("kanban_cards")
    .update({ column_name: newColumn })
    .eq("patient_id", patientId);
}
