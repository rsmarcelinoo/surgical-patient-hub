/**
 * ListView Page
 * 
 * Displays all patients in a filterable, sortable table format.
 * Provides comprehensive filtering by date, urgency, hospital, kanban column, and custom tags.
 * 
 * Features:
 * - Full patient list with search
 * - Advanced filtering (date range, urgency, hospital, kanban column, tags)
 * - Sortable columns
 * - Quick actions for each patient
 * - Pagination for large datasets
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, differenceInYears, isAfter, isBefore, parseISO } from "date-fns";
import { Search, Filter, X, Calendar as CalendarIcon, ChevronUp, ChevronDown, ExternalLink, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddPatientDialog } from "@/components/patient/AddPatientDialog";
import { EditPatientDialog } from "@/components/patient/EditPatientDialog";

/** Interface for patient data with related info */
interface PatientWithDetails {
  id: string;
  name: string;
  medical_record_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

/** Sort configuration */
type SortField = "name" | "medical_record_number" | "date_of_birth" | "created_at";
type SortDirection = "asc" | "desc";

/** Urgency levels for filtering */
const urgencyLevels = [
  { value: "all", label: "All Urgency" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

/** Kanban column options for filtering */
const kanbanColumns = [
  { value: "all", label: "All Columns" },
  { value: "waiting", label: "Waiting List" },
  { value: "scheduled", label: "Scheduled" },
  { value: "pending", label: "Pending" },
  { value: "operated", label: "Operated" },
  { value: "follow_up", label: "Follow-up" },
];

export default function ListView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Search and filter states - initialize from URL params
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [kanbanColumnFilter, setKanbanColumnFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Edit patient dialog state
  const [editPatient, setEditPatient] = useState<PatientWithDetails | null>(null);

  // Initialize filters from URL params
  useEffect(() => {
    const kanbanColumn = searchParams.get("kanbanColumn");
    if (kanbanColumn) {
      setKanbanColumnFilter(kanbanColumn);
    }
  }, [searchParams]);

  /**
   * Fetch all hospitals for filter dropdown
   */
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-list-filter"],
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
   * Fetch all patients
   */
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients-list-view"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as PatientWithDetails[];
    },
  });

  /**
   * Fetch kanban cards to get urgency and column info
   */
  const { data: kanbanCards = [] } = useQuery({
    queryKey: ["kanban-cards-list-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_cards")
        .select("patient_id, priority, column_name, board_id, kanban_boards(hospital_id)");
      if (error) throw error;
      return data;
    },
  });

  /**
   * Filter and sort patients based on current criteria
   */
  const filteredPatients = useMemo(() => {
    let result = [...patients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.medical_record_number?.toLowerCase().includes(query) ||
          p.contact_email?.toLowerCase().includes(query) ||
          p.contact_phone?.includes(query)
      );
    }

    // Hospital filter (based on kanban board assignment)
    if (hospitalFilter !== "all") {
      const patientIdsInHospital = kanbanCards
        .filter((card) => {
          const board = card.kanban_boards as { hospital_id: string | null } | null;
          return board?.hospital_id === hospitalFilter;
        })
        .map((card) => card.patient_id);
      result = result.filter((p) => patientIdsInHospital.includes(p.id));
    }

    // Urgency filter
    if (urgencyFilter !== "all") {
      const patientIdsWithUrgency = kanbanCards
        .filter((card) => card.priority === urgencyFilter)
        .map((card) => card.patient_id);
      result = result.filter((p) => patientIdsWithUrgency.includes(p.id));
    }

    // Kanban column filter
    if (kanbanColumnFilter !== "all") {
      const patientIdsInColumn = kanbanCards
        .filter((card) => card.column_name === kanbanColumnFilter)
        .map((card) => card.patient_id);
      result = result.filter((p) => patientIdsInColumn.includes(p.id));
    }

    // Date range filter (based on created_at)
    if (dateFrom) {
      result = result.filter((p) => isAfter(parseISO(p.created_at), dateFrom));
    }
    if (dateTo) {
      result = result.filter((p) => isBefore(parseISO(p.created_at), dateTo));
    }

    // Sort
    result.sort((a, b) => {
      let valueA: string | number | null = null;
      let valueB: string | number | null = null;

      switch (sortField) {
        case "name":
          valueA = a.name;
          valueB = b.name;
          break;
        case "medical_record_number":
          valueA = a.medical_record_number;
          valueB = b.medical_record_number;
          break;
        case "date_of_birth":
          valueA = a.date_of_birth;
          valueB = b.date_of_birth;
          break;
        case "created_at":
          valueA = a.created_at;
          valueB = b.created_at;
          break;
      }

      if (valueA === null) return 1;
      if (valueB === null) return -1;

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [patients, searchQuery, hospitalFilter, urgencyFilter, kanbanColumnFilter, dateFrom, dateTo, sortField, sortDirection, kanbanCards]);

  /**
   * Toggle sort direction or change sort field
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  /**
   * Get patient's urgency from kanban cards
   */
  const getPatientUrgency = (patientId: string) => {
    const card = kanbanCards.find((c) => c.patient_id === patientId);
    return card?.priority || null;
  };

  /**
   * Get patient's kanban column
   */
  const getPatientKanbanColumn = (patientId: string) => {
    const card = kanbanCards.find((c) => c.patient_id === patientId);
    return card?.column_name || null;
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchQuery("");
    setHospitalFilter("all");
    setUrgencyFilter("all");
    setKanbanColumnFilter("all");
    setDateFrom(undefined);
    setSearchParams({});
    setDateTo(undefined);
  };

  const hasFilters = searchQuery || hospitalFilter !== "all" || urgencyFilter !== "all" || kanbanColumnFilter !== "all" || dateFrom || dateTo;

  /**
   * Render sort indicator
   */
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  /**
   * Urgency badge colors
   */
  const urgencyColors: Record<string, string> = {
    urgent: "bg-destructive text-destructive-foreground",
    high: "bg-warning text-warning-foreground",
    normal: "bg-info text-info-foreground",
    low: "bg-success text-success-foreground",
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Patient List</h1>
            <p className="text-sm text-muted-foreground">
              View and manage all patients ({filteredPatients.length} of {patients.length})
            </p>
          </div>
          <AddPatientDialog />
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients (name, MRN, email, phone)..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

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

              {/* Urgency Filter */}
              <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Urgency" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Kanban Column Filter */}
              <Select value={kanbanColumnFilter} onValueChange={setKanbanColumnFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Columns" />
                </SelectTrigger>
                <SelectContent>
                  {kanbanColumns.map((col) => (
                    <SelectItem key={col.value} value={col.value}>
                      {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "MMM d, yyyy") : "To Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                </PopoverContent>
              </Popover>

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

        {/* Patients Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header">
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("name")}
                  >
                    Name <SortIndicator field="name" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("medical_record_number")}
                  >
                    MRN <SortIndicator field="medical_record_number" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("date_of_birth")}
                  >
                    Age <SortIndicator field="date_of_birth" />
                  </TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("created_at")}
                  >
                    Added <SortIndicator field="created_at" />
                  </TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-muted rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No patients found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => {
                    const urgency = getPatientUrgency(patient.id);
                    const age = patient.date_of_birth
                      ? differenceInYears(new Date(), new Date(patient.date_of_birth))
                      : null;

                    return (
                      <TableRow 
                        key={patient.id} 
                        className="cursor-pointer hover:bg-table-row-hover"
                        onClick={() => navigate(`/patient/${patient.id}`)}
                      >
                        <TableCell className="font-medium">{patient.name}</TableCell>
                        <TableCell>{patient.medical_record_number || "—"}</TableCell>
                        <TableCell>{age !== null ? `${age} years` : "—"}</TableCell>
                        <TableCell className="capitalize">{patient.gender || "—"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {patient.contact_phone || patient.contact_email || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {urgency ? (
                            <Badge className={cn("capitalize", urgencyColors[urgency] || "bg-muted")}>
                              {urgency}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(new Date(patient.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditPatient(patient);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/patient/${patient.id}`);
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Patient Dialog */}
        {editPatient && (
          <EditPatientDialog
            open={!!editPatient}
            onOpenChange={(open) => !open && setEditPatient(null)}
            patient={editPatient}
          />
        )}
      </div>
    </AppLayout>
  );
}
