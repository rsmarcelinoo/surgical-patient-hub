/**
 * KanbanBoard Page
 * 
 * Displays a kanban board for managing patient workflow.
 * Uses AppLayout for consistent sidebar navigation.
 * Supports filtering by hospital, urgency, and date range.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { KanbanFilters, FilterState } from "@/components/kanban/KanbanFilters";
import { PatientCardDialog } from "@/components/kanban/PatientCardDialog";
import {
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  Flag,
  Settings,
  Trash2,
  Edit,
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
}

interface KanbanCard {
  id: string;
  patient_id: string;
  column_name: string;
  position: number;
  notes: string | null;
  priority: string | null;
  scheduled_date: string | null;
  surgery_type: string | null;
  patient?: {
    id: string;
    name: string;
    medical_record_number: string | null;
  };
}

const columnColors: Record<string, { bg: string; badge: string; dot: string }> = {
  gray: { bg: "bg-slate-50", badge: "bg-slate-200 text-slate-700", dot: "bg-slate-400" },
  blue: { bg: "bg-blue-50", badge: "bg-blue-500 text-white", dot: "bg-blue-500" },
  yellow: { bg: "bg-amber-50", badge: "bg-amber-500 text-white", dot: "bg-amber-500" },
  orange: { bg: "bg-orange-50", badge: "bg-orange-500 text-white", dot: "bg-orange-500" },
  red: { bg: "bg-red-50", badge: "bg-red-500 text-white", dot: "bg-red-500" },
  green: { bg: "bg-emerald-50", badge: "bg-emerald-500 text-white", dot: "bg-emerald-500" },
  purple: { bg: "bg-purple-50", badge: "bg-purple-500 text-white", dot: "bg-purple-500" },
  pink: { bg: "bg-pink-50", badge: "bg-pink-400 text-white", dot: "bg-pink-400" },
};

const priorityConfig: Record<string, { icon: string; color: string }> = {
  urgent: { icon: "🚨", color: "text-destructive" },
  high: { icon: "🔴", color: "text-red-500" },
  normal: { icon: "🟡", color: "text-amber-500" },
  low: { icon: "🟢", color: "text-emerald-500" },
};

export default function KanbanBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [addCardColumn, setAddCardColumn] = useState<string | null>(null);
  const [newCardPatientId, setNewCardPatientId] = useState("");
  const [newCardSurgeryType, setNewCardSurgeryType] = useState("");
  const [newCardPriority, setNewCardPriority] = useState("normal");
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnColor, setNewColumnColor] = useState("gray");

  // Selected card for dialog
  const [selectedCard, setSelectedCard] = useState<{
    cardId: string;
    patientId: string;
    columnName: string;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    hospital: "all",
    urgency: "all",
    dateFrom: undefined,
    dateTo: undefined,
    tags: [],
  });

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["kanban-board", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .select("*, hospital:hospitals(id, name)")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["kanban-cards", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_cards")
        .select("*, patient:patients(id, name, medical_record_number)")
        .eq("board_id", id!)
        .order("position");
      if (error) throw error;
      return data as KanbanCard[];
    },
    enabled: !!id,
  });

  const { data: patients = [] } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, medical_record_number")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, newColumn }: { cardId: string; newColumn: string }) => {
      const { error } = await supabase
        .from("kanban_cards")
        .update({ column_name: newColumn })
        .eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards", id] });
      toast.success("Card moved successfully");
    },
  });

  const addCardMutation = useMutation({
    mutationFn: async ({
      columnId,
      patientId,
      surgeryType,
      priority,
    }: {
      columnId: string;
      patientId: string;
      surgeryType: string;
      priority: string;
    }) => {
      const { error } = await supabase.from("kanban_cards").insert({
        board_id: id!,
        patient_id: patientId,
        column_name: columnId,
        surgery_type: surgeryType || null,
        priority,
        position: cards.filter((c) => c.column_name === columnId).length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards", id] });
      setAddCardColumn(null);
      setNewCardPatientId("");
      setNewCardSurgeryType("");
      setNewCardPriority("normal");
      toast.success("Patient added to board");
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("kanban_cards").delete().eq("id", cardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards", id] });
      toast.success("Card removed");
    },
  });

  const updateColumnsMutation = useMutation({
    mutationFn: async (columns: KanbanColumn[]) => {
      const { error } = await supabase
        .from("kanban_boards")
        .update({ columns_config: JSON.parse(JSON.stringify(columns)) })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-board", id] });
      toast.success("Columns updated");
    },
  });

  const handleDragStart = (cardId: string) => {
    setDraggedCard(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (columnId: string) => {
    if (draggedCard) {
      moveCardMutation.mutate({ cardId: draggedCard, newColumn: columnId });
      setDraggedCard(null);
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    const columns = (board?.columns_config as unknown as KanbanColumn[]) || [];
    const newColumn: KanbanColumn = {
      id: newColumnName.toLowerCase().replace(/\s+/g, "_"),
      name: newColumnName,
      color: newColumnColor,
    };
    updateColumnsMutation.mutate([...columns, newColumn]);
    setAddColumnOpen(false);
    setNewColumnName("");
    setNewColumnColor("gray");
  };

  const handleDeleteColumn = (columnId: string) => {
    const columns = (board?.columns_config as unknown as KanbanColumn[]) || [];
    const filtered = columns.filter((c) => c.id !== columnId);
    updateColumnsMutation.mutate(filtered);
  };

  // Filter cards based on filter state
  const getCardsForColumn = useMemo(() => {
    return (columnId: string) => {
      return cards
        .filter((card) => card.column_name === columnId)
        .filter((card) => {
          // Search filter
          if (filters.search) {
            const query = filters.search.toLowerCase();
            const matchesName = card.patient?.name.toLowerCase().includes(query);
            const matchesMrn = card.patient?.medical_record_number?.toLowerCase().includes(query);
            const matchesSurgeryType = card.surgery_type?.toLowerCase().includes(query);
            if (!matchesName && !matchesMrn && !matchesSurgeryType) return false;
          }

          // Urgency filter
          if (filters.urgency !== "all" && card.priority !== filters.urgency) {
            return false;
          }

          // Date range filter
          if (card.scheduled_date) {
            const cardDate = new Date(card.scheduled_date);
            if (filters.dateFrom && isBefore(cardDate, filters.dateFrom)) return false;
            if (filters.dateTo && isAfter(cardDate, filters.dateTo)) return false;
          } else if (filters.dateFrom || filters.dateTo) {
            // If date filter is set but card has no date, exclude it
            return false;
          }

          return true;
        });
    };
  }, [cards, filters]);

  if (boardLoading || cardsLoading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-96 w-72 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!board) {
    return (
      <AppLayout>
        <div className="p-6">
          <p className="text-muted-foreground">Board not found</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const columns: KanbanColumn[] = (board.columns_config as unknown) as KanbanColumn[];

  return (
    <AppLayout>
      <div className="p-4 space-y-4 min-h-full bg-slate-100">
        {/* Board Header */}
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-semibold">{board.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {board.hospital && <span>{(board.hospital as { name: string }).name}</span>}
                {board.service && (
                  <>
                    <span>•</span>
                    <span>{board.service}</span>
                  </>
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2">
              <KanbanFilters filters={filters} onFiltersChange={setFilters} />
              <Dialog open={addColumnOpen} onOpenChange={setAddColumnOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Add Column
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Column</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Column Name</Label>
                      <Input
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        placeholder="e.g., In Progress"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select value={newColumnColor} onValueChange={setNewColumnColor}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(columnColors).map((color) => (
                            <SelectItem key={color} value={color}>
                              <div className="flex items-center gap-2">
                                <div className={cn("w-3 h-3 rounded-full", columnColors[color].dot)} />
                                <span className="capitalize">{color}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddColumn} className="w-full">
                      Add Column
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Kanban Columns */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnCards = getCardsForColumn(column.id);
            const colors = columnColors[column.color] || columnColors.gray;

            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-72"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                {/* Column Header */}
                <div className={cn("rounded-t-lg px-3 py-2", colors.bg)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                      <Badge className={cn("text-xs font-medium uppercase", colors.badge)}>
                        {column.name}
                      </Badge>
                      <span className="text-sm font-medium text-muted-foreground">
                        {columnCards.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteColumn(column.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setAddCardColumn(column.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Cards Container */}
                <div className={cn("min-h-[400px] rounded-b-lg p-2 space-y-2", colors.bg)}>
                  {columnCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={() => handleDragStart(card.id)}
                      onClick={() => card.patient && setSelectedCard({
                        cardId: card.id,
                        patientId: card.patient.id,
                        columnName: column.name,
                      })}
                      className={cn(
                        "bg-card rounded-lg border shadow-sm p-3 cursor-pointer",
                        "hover:shadow-md transition-shadow",
                        draggedCard === card.id && "opacity-50"
                      )}
                    >
                      {/* Card Title */}
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium text-sm hover:text-primary">
                          {card.patient?.name || "Unknown Patient"}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 -mt-1">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              card.patient && navigate(`/patient/${card.patient.id}`);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Full Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteCardMutation.mutate(card.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from Board
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Surgery Type */}
                      {card.surgery_type && (
                        <p className="text-xs text-muted-foreground mb-2">{card.surgery_type}</p>
                      )}

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-2 h-2 rounded-full", colors.dot)} />
                        <span className="text-xs text-muted-foreground uppercase">{column.name}</span>
                      </div>

                      {/* MRN */}
                      {card.patient?.medical_record_number && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          <span>{card.patient.medical_record_number}</span>
                        </div>
                      )}

                      {/* Date */}
                      {card.scheduled_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Calendar className="h-3 w-3" />
                          <span className="text-primary">
                            {format(new Date(card.scheduled_date), "MM/dd/yyyy")}
                          </span>
                        </div>
                      )}

                      {/* Priority */}
                      {card.priority && (
                        <div className="flex items-center gap-1 text-xs">
                          <Flag className={cn("h-3 w-3", priorityConfig[card.priority]?.color || "text-muted-foreground")} />
                          <span className="capitalize">{card.priority}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Task Button */}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => setAddCardColumn(column.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add patient
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={!!addCardColumn} onOpenChange={(open) => !open && setAddCardColumn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Patient to Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select value={newCardPatientId} onValueChange={setNewCardPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name} {patient.medical_record_number && `(${patient.medical_record_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Surgery Type (optional)</Label>
              <Input
                value={newCardSurgeryType}
                onChange={(e) => setNewCardSurgeryType(e.target.value)}
                placeholder="e.g., Appendectomy"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={newCardPriority} onValueChange={setNewCardPriority}>
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
            <Button
              onClick={() =>
                addCardColumn &&
                newCardPatientId &&
                addCardMutation.mutate({
                  columnId: addCardColumn,
                  patientId: newCardPatientId,
                  surgeryType: newCardSurgeryType,
                  priority: newCardPriority,
                })
              }
              disabled={!newCardPatientId}
              className="w-full"
            >
              Add Patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Patient Card Dialog */}
      {selectedCard && (
        <PatientCardDialog
          open={!!selectedCard}
          onOpenChange={(open) => !open && setSelectedCard(null)}
          cardId={selectedCard.cardId}
          patientId={selectedCard.patientId}
          columnName={selectedCard.columnName}
          boardId={id!}
        />
      )}
    </AppLayout>
  );
}
