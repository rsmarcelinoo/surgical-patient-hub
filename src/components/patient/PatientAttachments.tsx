/**
 * PatientAttachments Component
 * 
 * Displays and manages file attachments for a patient.
 * Supports filtering by episode and surgery.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, File, Download, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FileUpload } from "./FileUpload";

interface PatientAttachmentsProps {
  /** Patient ID to fetch attachments for */
  patientId: string;
  /** Optional surgery ID to filter attachments */
  surgeryId?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  photo: <Image className="h-5 w-5" />,
  pdf: <FileText className="h-5 w-5" />,
  scan: <File className="h-5 w-5" />,
  drawing: <File className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
};

const typeColors: Record<string, string> = {
  photo: "bg-success/10 text-success",
  pdf: "bg-destructive/10 text-destructive",
  scan: "bg-info/10 text-info",
  drawing: "bg-warning/10 text-warning",
  document: "bg-muted text-muted-foreground",
};

export function PatientAttachments({ patientId, surgeryId }: PatientAttachmentsProps) {
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["patient-attachments", patientId, surgeryId],
    queryFn: async () => {
      let query = supabase
        .from("attachments")
        .select("*")
        .eq("patient_id", patientId);
      
      // Filter by surgery if provided
      if (surgeryId) {
        query = query.eq("surgery_id", surgeryId);
      }
      
      const { data, error } = await query.order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (attachments.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No attachments uploaded</p>
            <FileUpload patientId={patientId} surgeryId={surgeryId} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <FileUpload patientId={patientId} surgeryId={surgeryId} />
      </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeColors[attachment.attachment_type] || typeColors.document}`}>
                {typeIcons[attachment.attachment_type] || typeIcons.document}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {attachment.attachment_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(attachment.uploaded_at), "dd MMM yyyy")}
                  </span>
                </div>
                {attachment.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {attachment.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={attachment.file_url} download={attachment.file_name}>
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}
