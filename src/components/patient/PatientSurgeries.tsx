import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Users } from "lucide-react";
import { format } from "date-fns";
import { AddSurgeryDialog } from "./AddSurgeryDialog";

interface PatientSurgeriesProps {
  patientId: string;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
  in_progress: "bg-info/10 text-info",
};

export function PatientSurgeries({ patientId }: PatientSurgeriesProps) {
  const { data: surgeries = [], isLoading } = useQuery({
    queryKey: ["patient-surgeries", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("surgeries")
        .select("*")
        .eq("patient_id", patientId)
        .order("scheduled_date", { ascending: false });
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

  if (surgeries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <AddSurgeryDialog patientId={patientId} />
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center py-8">No surgeries recorded</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddSurgeryDialog patientId={patientId} />
      </div>
      <div className="space-y-3">
      {surgeries.map((surgery) => (
        <Card key={surgery.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{surgery.procedure_name}</CardTitle>
                <Badge className={statusColors[surgery.status] || statusColors.scheduled}>
                  {surgery.status}
                </Badge>
              </div>
              {surgery.operating_room && (
                <Badge variant="outline">Room {surgery.operating_room}</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {surgery.scheduled_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(surgery.scheduled_date), "dd MMM yyyy, HH:mm")}</span>
                </div>
              )}
              {surgery.duration_minutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{surgery.duration_minutes} min</span>
                </div>
              )}
            </div>

            {/* Surgical team */}
            <div className="flex items-center gap-4 text-sm">
              {(surgery.main_surgeon || surgery.surgeon) && (
                <div className="flex items-center gap-1 text-foreground">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium">{surgery.main_surgeon || surgery.surgeon}</span>
                </div>
              )}
              {surgery.assistants && surgery.assistants.length > 0 && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{surgery.assistants.join(", ")}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {surgery.structured_description && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{surgery.structured_description}</p>
              </div>
            )}

            {surgery.notes && (
              <p className="text-sm text-muted-foreground">{surgery.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
