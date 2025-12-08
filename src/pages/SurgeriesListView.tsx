/**
 * SurgeriesListView Page
 * 
 * Displays all surgeries in a filterable, sortable table format.
 * Supports filtering by status (scheduled/completed/cancelled), hospital, date range.
 * Can receive initial filter state via URL search params.
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Search, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interface for surgery data with patient info */
interface SurgeryWithPatient {
  id: string;
  procedure_name: string;
  scheduled_date: string | null;
  status: string;
  operating_room: string | null;
  main_surgeon: string | null;
  surgeon: string | null;
  hospital_id: string | null;
  patient_id: string;
  patients: {
    id: string;
    name: string;
    medical_record_number: string | null;
  } | null;
  hospitals: {
    id: string;
    name: string;
  } | null;
  created_at: string;
}

/** Status badge colors */
const statusColors: Record<string, string> = {
  scheduled: "bg-warning text-warning-foreground",
  pending: "bg-orange-500 text-white",
  completed: "bg-success text-success-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
  in_progress: "bg-info text-info-foreground",
};

export default function SurgeriesListView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Initialize filters from URL params
  const initialStatus = searchParams.get("status") || "all";
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");

  // Update filter when URL params change
  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  /**
   * Fetch all hospitals for filter dropdown
   */
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-surgeries-filter"],
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
   * Fetch all surgeries with patient info
   */
  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ["surgeries-list-view"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*, patients(id, name, medical_record_number), hospitals(id, name)")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data as SurgeryWithPatient[];
    },
  });

  /**
   * Filter surgeries based on current criteria
   */
  const filteredSurgeries = useMemo(() => {
    let result = [...surgeries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.procedure_name.toLowerCase().includes(query) ||
          s.patients?.name.toLowerCase().includes(query) ||
          s.patients?.medical_record_number?.toLowerCase().includes(query) ||
          s.main_surgeon?.toLowerCase().includes(query) ||
          s.surgeon?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    // Hospital filter
    if (hospitalFilter !== "all") {
      result = result.filter((s) => s.hospital_id === hospitalFilter);
    }

    return result;
  }, [surgeries, searchQuery, statusFilter, hospitalFilter]);

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setHospitalFilter("all");
  };

  const hasFilters = searchQuery || statusFilter !== "all" || hospitalFilter !== "all";

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Surgeries</h1>
            <p className="text-sm text-muted-foreground">
              View all surgeries ({filteredSurgeries.length} of {surgeries.length})
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search surgeries (procedure, patient, surgeon)..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Hospital Filter */}
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

              {/* Clear Filters */}
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Surgeries Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead>Procedure</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Surgeon</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredSurgeries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No surgeries found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSurgeries.map((surgery) => (
                    <TableRow
                      key={surgery.id}
                      className="cursor-pointer hover:bg-table-row-hover"
                      onClick={() => surgery.patients?.id && navigate(`/patient/${surgery.patients.id}`)}
                    >
                      <TableCell className="font-medium">{surgery.procedure_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{surgery.patients?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {surgery.patients?.medical_record_number || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {surgery.scheduled_date
                          ? format(new Date(surgery.scheduled_date), "MMM d, yyyy HH:mm")
                          : "—"}
                      </TableCell>
                      <TableCell>{surgery.main_surgeon || surgery.surgeon || "—"}</TableCell>
                      <TableCell>{surgery.hospitals?.name || "—"}</TableCell>
                      <TableCell>{surgery.operating_room || "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize", statusColors[surgery.status] || "bg-muted")}>
                          {surgery.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            surgery.patients?.id && navigate(`/patient/${surgery.patients.id}`);
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
