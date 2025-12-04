import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MoreHorizontal, Calendar, User, GripVertical } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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

const colorMap: Record<string, string> = {
  gray: "bg-muted border-muted-foreground/30",
  yellow: "bg-warning/10 border-warning",
  green: "bg-success/10 border-success",
  blue: "bg-info/10 border-info",
  red: "bg-destructive/10 border-destructive",
};

const badgeColorMap: Record<string, string> = {
  gray: "bg-muted text-muted-foreground",
  yellow: "bg-warning text-warning-foreground",
  green: "bg-success text-success-foreground",
  blue: "bg-info text-info-foreground",
  red: "bg-destructive text-destructive-foreground",
};

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  normal: "bg-muted text-muted-foreground",
  low: "bg-success/10 text-success",
};

export default function KanbanBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draggedCard, setDraggedCard] = useState<string | null>(null);

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["kanban-board", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .select("*, hospital:hospitals(name)")
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

  if (boardLoading || cardsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-96 w-72 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-muted-foreground">Board not found</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const columns: KanbanColumn[] = (board.columns_config as unknown) as KanbanColumn[];

  const getCardsForColumn = (columnId: string) => {
    return cards.filter((card) => card.column_name === columnId);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        {/* Back button and board header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{board.name}</h1>
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
          </div>
        </div>

        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnCards = getCardsForColumn(column.id);
            return (
              <div
                key={column.id}
                className="flex-shrink-0 w-80"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.id)}
              >
                <div className={cn("rounded-lg border-2 p-3", colorMap[column.color] || colorMap.gray)}>
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", badgeColorMap[column.color] || badgeColorMap.gray)}>
                        {column.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{columnCards.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2 min-h-[200px]">
                    {columnCards.map((card) => (
                      <Card
                        key={card.id}
                        draggable
                        onDragStart={() => handleDragStart(card.id)}
                        className={cn(
                          "cursor-grab active:cursor-grabbing bg-card hover:shadow-md transition-shadow",
                          draggedCard === card.id && "opacity-50"
                        )}
                      >
                        <CardContent className="p-3 space-y-2">
                          {/* Card header with patient name */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                              <span 
                                className="font-medium text-sm cursor-pointer hover:text-primary"
                                onClick={() => card.patient && navigate(`/patient/${card.patient.id}`)}
                              >
                                {card.patient?.name || "Unknown Patient"}
                              </span>
                            </div>
                          </div>

                          {/* Surgery type */}
                          {card.surgery_type && (
                            <p className="text-sm text-muted-foreground">{card.surgery_type}</p>
                          )}

                          {/* Card metadata */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {card.patient?.medical_record_number && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{card.patient.medical_record_number}</span>
                              </div>
                            )}
                            {card.scheduled_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(card.scheduled_date), "dd MMM")}</span>
                              </div>
                            )}
                          </div>

                          {/* Priority badge */}
                          {card.priority && card.priority !== "normal" && (
                            <Badge className={cn("text-xs", priorityColors[card.priority] || priorityColors.normal)}>
                              {card.priority}
                            </Badge>
                          )}

                          {/* Notes preview */}
                          {card.notes && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{card.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
