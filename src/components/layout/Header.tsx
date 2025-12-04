import { Activity, LayoutDashboard, Kanban, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: boards = [] } = useQuery({
    queryKey: ["kanban-boards-nav"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .select("id, name, hospital:hospitals(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">GesDoente</h1>
            <p className="text-xs text-muted-foreground">Surgical Management</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Kanban className="h-4 w-4" />
                Kanban Boards
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {boards.length === 0 ? (
                <DropdownMenuItem disabled>No boards available</DropdownMenuItem>
              ) : (
                boards.map((board) => (
                  <DropdownMenuItem key={board.id} asChild>
                    <Link to={`/kanban/${board.id}`} className="w-full">
                      <div>
                        <p className="font-medium">{board.name}</p>
                        {board.hospital && (
                          <p className="text-xs text-muted-foreground">
                            {(board.hospital as { name: string }).name}
                          </p>
                        )}
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
