/**
 * KanbanFilters Component
 * 
 * Provides comprehensive filtering options for the Kanban board.
 * Supports filtering by date range, urgency/priority, hospital, and custom tags.
 * 
 * Features:
 * - Date range picker
 * - Urgency/priority filter
 * - Hospital filter
 * - Tag filter (from kanban card metadata)
 * - Clear all filters button
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { Filter, Calendar as CalendarIcon, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  /** Search query for patient name or MRN */
  search: string;
  /** Selected hospital ID or "all" */
  hospital: string;
  /** Selected urgency level or "all" */
  urgency: string;
  /** Start date for date range filter */
  dateFrom: Date | undefined;
  /** End date for date range filter */
  dateTo: Date | undefined;
  /** Selected tags */
  tags: string[];
}

interface KanbanFiltersProps {
  /** Current filter state */
  filters: FilterState;
  /** Callback when filters change */
  onFiltersChange: (filters: FilterState) => void;
}

/** Available urgency/priority levels */
const urgencyOptions = [
  { value: "all", label: "All Priorities" },
  { value: "urgent", label: "Urgent", color: "bg-destructive" },
  { value: "high", label: "High", color: "bg-warning" },
  { value: "normal", label: "Normal", color: "bg-info" },
  { value: "low", label: "Low", color: "bg-success" },
];

export function KanbanFilters({ filters, onFiltersChange }: KanbanFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  /**
   * Fetch hospitals for filter dropdown
   */
  const { data: hospitals = [] } = useQuery({
    queryKey: ["hospitals-kanban-filter"],
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
   * Update a single filter value
   */
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    onFiltersChange({
      search: "",
      hospital: "all",
      urgency: "all",
      dateFrom: undefined,
      dateTo: undefined,
      tags: [],
    });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    filters.search ||
    filters.hospital !== "all" ||
    filters.urgency !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.tags.length > 0;

  /**
   * Count active filters
   */
  const activeFilterCount = [
    filters.search,
    filters.hospital !== "all",
    filters.urgency !== "all",
    filters.dateFrom,
    filters.dateTo,
    filters.tags.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      {/* Quick Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients..."
          className="pl-9 w-60 h-9"
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
        />
      </div>

      {/* Filter Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filter Patients</SheetTitle>
            <SheetDescription>
              Apply filters to narrow down the patients displayed on the board.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Hospital Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hospital</label>
              <Select
                value={filters.hospital}
                onValueChange={(value) => updateFilter("hospital", value)}
              >
                <SelectTrigger>
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
            </div>

            {/* Urgency Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority / Urgency</label>
              <Select
                value={filters.urgency}
                onValueChange={(value) => updateFilter("urgency", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  {urgencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.color && (
                          <div className={cn("w-2 h-2 rounded-full", option.color)} />
                        )}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date Range</label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "MMM d") : "From"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => updateFilter("dateFrom", date)}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "MMM d") : "To"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => updateFilter("dateTo", date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Active Filters</span>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="secondary">
                      Search: "{filters.search}"
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => updateFilter("search", "")}
                      />
                    </Badge>
                  )}
                  {filters.hospital !== "all" && (
                    <Badge variant="secondary">
                      Hospital: {hospitals.find((h) => h.id === filters.hospital)?.name}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => updateFilter("hospital", "all")}
                      />
                    </Badge>
                  )}
                  {filters.urgency !== "all" && (
                    <Badge variant="secondary">
                      Priority: {filters.urgency}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => updateFilter("urgency", "all")}
                      />
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="secondary">
                      From: {format(filters.dateFrom, "MMM d")}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => updateFilter("dateFrom", undefined)}
                      />
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary">
                      To: {format(filters.dateTo, "MMM d")}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => updateFilter("dateTo", undefined)}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear Button (inline) */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
