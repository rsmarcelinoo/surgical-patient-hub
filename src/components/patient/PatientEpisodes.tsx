import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Building2 } from "lucide-react";
import { format } from "date-fns";

interface PatientEpisodesProps {
  patientId: string;
}

const statusColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  completed: "bg-info/10 text-info",
  archived: "bg-muted text-muted-foreground",
};

const typeLabels: Record<string, string> = {
  hospitalization: "Hospitalization",
  follow_up: "Follow-up",
  complication: "Complication",
  outpatient: "Outpatient",
};

export function PatientEpisodes({ patientId }: PatientEpisodesProps) {
  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["patient-episodes", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("episodes")
        .select("*, hospital:hospitals(name)")
        .eq("patient_id", patientId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (episodes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">No episodes recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {episodes.map((episode) => (
        <Card key={episode.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{episode.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusColors[episode.status] || statusColors.active}>
                    {episode.status}
                  </Badge>
                  <Badge variant="outline">
                    {typeLabels[episode.episode_type] || episode.episode_type}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(episode.start_date), "dd MMM yyyy")}
                  {episode.end_date && ` - ${format(new Date(episode.end_date), "dd MMM yyyy")}`}
                </span>
              </div>
              {episode.hospital && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{(episode.hospital as { name: string }).name}</span>
                </div>
              )}
            </div>
            {episode.description && (
              <p className="text-sm text-muted-foreground">{episode.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
