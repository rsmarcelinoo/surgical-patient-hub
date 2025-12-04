import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Stethoscope } from "lucide-react";
import { format } from "date-fns";

interface PatientConsultationsProps {
  patientId: string;
}

const typeLabels: Record<string, string> = {
  pre_op: "Pre-Op",
  post_op: "Post-Op",
  complication: "Complication",
  re_intervention: "Re-intervention",
  exam: "Exam",
  routine: "Routine",
};

const typeColors: Record<string, string> = {
  pre_op: "bg-info/10 text-info",
  post_op: "bg-success/10 text-success",
  complication: "bg-destructive/10 text-destructive",
  re_intervention: "bg-warning/10 text-warning",
  exam: "bg-muted text-muted-foreground",
  routine: "bg-muted text-muted-foreground",
};

export function PatientConsultations({ patientId }: PatientConsultationsProps) {
  const { data: consultations = [], isLoading } = useQuery({
    queryKey: ["patient-consultations", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultations")
        .select("*")
        .eq("patient_id", patientId)
        .order("consultation_date", { ascending: false });
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

  if (consultations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">No consultations recorded</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {consultations.map((consultation) => (
        <Card key={consultation.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-primary" />
                <Badge className={typeColors[consultation.consultation_type] || typeColors.routine}>
                  {typeLabels[consultation.consultation_type] || consultation.consultation_type}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(consultation.consultation_date), "dd MMM yyyy, HH:mm")}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {consultation.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{consultation.location}</span>
              </div>
            )}

            {consultation.diagnosis && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Diagnosis</span>
                <p className="text-sm">{consultation.diagnosis}</p>
              </div>
            )}

            {consultation.treatment_plan && (
              <div>
                <span className="text-xs font-medium text-muted-foreground uppercase">Treatment Plan</span>
                <p className="text-sm">{consultation.treatment_plan}</p>
              </div>
            )}

            {consultation.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">{consultation.notes}</p>
              </div>
            )}

            {consultation.follow_up_date && (
              <div className="flex items-center gap-1 text-sm text-info">
                <Calendar className="h-4 w-4" />
                <span>Follow-up: {format(new Date(consultation.follow_up_date), "dd MMM yyyy")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
