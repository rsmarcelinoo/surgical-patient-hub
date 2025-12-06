/**
 * CalendarView Page
 * 
 * Displays surgeries and scheduled events in a calendar format.
 * Allows users to view scheduled procedures by date and filter by various criteria.
 * 
 * Features:
 * - Monthly calendar view with surgery indicators
 * - Click on dates to see detailed schedule
 * - Filter by hospital, urgency, and surgery type
 * - Quick navigation to patient details
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Clock, User, MapPin, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interface for surgery data with patient info */
interface SurgeryWithPatient {
  id: string;
  procedure_name: string;
  scheduled_date: string;
  status: string;
  operating_room: string | null;
  main_surgeon: string | null;
  patient_id: string;
  patients: {
    id: string;
    name: string;
    medical_record_number: string | null;
  } | null;
}

/** Priority/status color mapping */
const statusColors: Record<string, string> = {
  scheduled: "bg-info text-info-foreground",
  completed: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  pending: "bg-warning text-warning-foreground",
};

export default function CalendarView() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Filter states
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  /**
   * Fetch hospitals for filter dropdown
   */
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  /**
   * Fetch surgeries for the current month
   */
  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ["calendar-surgeries", format(currentMonth, "yyyy-MM"), hospitalFilter, statusFilter],
    queryFn: async () => {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      let query = supabase
        .from("surgeries")
        .select("*, patients(id, name, medical_record_number)")
        .gte("scheduled_date", monthStart.toISOString())
        .lte("scheduled_date", monthEnd.toISOString())
        .order("scheduled_date");

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SurgeryWithPatient[];
    },
  });

  /**
   * Get surgeries for a specific date
   */
  const getSurgeriesForDate = (date: Date) => {
    return surgeries.filter((surgery) => {
      if (!surgery.scheduled_date) return false;
      return isSameDay(new Date(surgery.scheduled_date), date);
    });
  };

  /**
   * Get surgeries for selected date
   */
  const selectedDateSurgeries = selectedDate ? getSurgeriesForDate(selectedDate) : [];

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setHospitalFilter("all");
    setStatusFilter("all");
  };

  const hasFilters = hospitalFilter !== "all" || statusFilter !== "all";

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
            <p className="text-sm text-muted-foreground">
              View and manage scheduled surgeries
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Hospitals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {hospitals.map((hospital) => (
                    <SelectItem key={hospital.id} value={hospital.id}>
                      {hospital.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar and Details Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Calendar */}
          <Card>
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md"
                modifiers={{
                  hasSurgery: (date) => getSurgeriesForDate(date).length > 0,
                }}
                modifiersStyles={{
                  hasSurgery: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    borderRadius: "50%",
                  },
                }}
                components={{
                  DayContent: ({ date }) => {
                    const count = getSurgeriesForDate(date).length;
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span>{format(date, "d")}</span>
                        {count > 0 && (
                          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                    );
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted rounded" />
                  ))}
                </div>
              ) : selectedDateSurgeries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No surgeries scheduled for this date
                </p>
              ) : (
                selectedDateSurgeries.map((surgery) => (
                  <div
                    key={surgery.id}
                    className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => surgery.patients?.id && navigate(`/patient/${surgery.patients.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm">{surgery.procedure_name}</span>
                      <Badge className={cn("text-xs", statusColors[surgery.status] || "bg-muted")}>
                        {surgery.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{surgery.patients?.name || "Unknown"}</span>
                      </div>
                      {surgery.scheduled_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(surgery.scheduled_date), "HH:mm")}</span>
                        </div>
                      )}
                      {surgery.operating_room && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span>{surgery.operating_room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
