import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Patient {
  id: string;
  name: string;
  date_of_birth: string | null;
  medical_record_number: string | null;
}

export interface Surgery {
  id: string;
  procedure_name: string;
  scheduled_date: string | null;
  status: string;
  surgeon: string | null;
  operating_room: string | null;
  patients: Patient | null;
}

export interface KanbanCard {
  id: string;
  column_name: string;
  patients: Patient | null;
  kanban_boards: { name: string } | null;
  created_at: string;
}

export function useDashboardData() {
  const patientsQuery = useQuery({
    queryKey: ["patients-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patients")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const upcomingSurgeriesQuery = useQuery({
    queryKey: ["upcoming-surgeries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*, patients(id, name, date_of_birth, medical_record_number)")
        .eq("status", "scheduled")
        .gte("scheduled_date", new Date().toISOString())
        .order("scheduled_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as Surgery[];
    },
  });

  const recentSurgeriesQuery = useQuery({
    queryKey: ["recent-surgeries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*, patients(id, name, date_of_birth, medical_record_number)")
        .eq("status", "completed")
        .order("scheduled_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Surgery[];
    },
  });

  const pendingSurgeriesCountQuery = useQuery({
    queryKey: ["pending-surgeries-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("surgeries")
        .select("*", { count: "exact", head: true })
        .eq("status", "scheduled");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const completedThisMonthQuery = useQuery({
    queryKey: ["completed-this-month"],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("surgeries")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed")
        .gte("scheduled_date", startOfMonth.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });

  const waitingListQuery = useQuery({
    queryKey: ["waiting-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_cards")
        .select("*, patients(id, name, date_of_birth, medical_record_number), kanban_boards(name)")
        .eq("column_name", "waiting")
        .order("created_at", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as KanbanCard[];
    },
  });

  const waitingListCountQuery = useQuery({
    queryKey: ["waiting-list-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("kanban_cards")
        .select("*", { count: "exact", head: true })
        .eq("column_name", "waiting");
      if (error) throw error;
      return count ?? 0;
    },
  });

  return {
    totalPatients: patientsQuery.data ?? 0,
    pendingSurgeries: pendingSurgeriesCountQuery.data ?? 0,
    completedThisMonth: completedThisMonthQuery.data ?? 0,
    waitingListCount: waitingListCountQuery.data ?? 0,
    upcomingSurgeries: upcomingSurgeriesQuery.data ?? [],
    recentSurgeries: recentSurgeriesQuery.data ?? [],
    waitingList: waitingListQuery.data ?? [],
    isLoading:
      patientsQuery.isLoading ||
      upcomingSurgeriesQuery.isLoading ||
      recentSurgeriesQuery.isLoading ||
      pendingSurgeriesCountQuery.isLoading ||
      completedThisMonthQuery.isLoading ||
      waitingListQuery.isLoading ||
      waitingListCountQuery.isLoading,
  };
}
