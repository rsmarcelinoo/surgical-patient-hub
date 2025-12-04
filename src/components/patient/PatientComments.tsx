import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Pin, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PatientCommentsProps {
  patientId: string;
}

export function PatientComments({ patientId }: PatientCommentsProps) {
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["patient-comments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("patient_id", patientId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
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
              <div key={i} className="h-20 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center py-8">No comments yet</p>
        </CardContent>
      </Card>
    );
  }

  const renderTextWithMentions = (text: string, mentions: string[] | null) => {
    if (!mentions || mentions.length === 0) return text;
    
    let result = text;
    mentions.forEach((mention) => {
      result = result.replace(
        new RegExp(`@${mention}`, "g"),
        `<span class="text-primary font-medium">@${mention}</span>`
      );
    });
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <Card
          key={comment.id}
          className={cn(
            "hover:shadow-md transition-shadow",
            comment.is_pinned && "border-l-4 border-l-warning bg-warning/5"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author || "Unknown"}</span>
                    {comment.is_pinned && (
                      <Badge variant="outline" className="text-warning border-warning">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), "dd MMM yyyy, HH:mm")}
                  </span>
                </div>
                <p className="text-sm">
                  {renderTextWithMentions(comment.text, comment.mentions)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
