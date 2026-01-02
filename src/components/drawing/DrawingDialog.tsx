/**
 * DrawingDialog Component
 * 
 * A dialog wrapper for the DrawingCanvas, allowing users to create and save drawings
 * to the patient's attachments.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DrawingCanvas } from "./DrawingCanvas";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

interface DrawingDialogProps {
  patientId: string;
  surgeryId?: string;
  trigger?: React.ReactNode;
}

export function DrawingDialog({ patientId, surgeryId, trigger }: DrawingDialogProps) {
  const [open, setOpen] = useState(false);
  const [drawingName, setDrawingName] = useState("");
  const [drawingData, setDrawingData] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const uploadDrawingMutation = useMutation({
    mutationFn: async (dataUrl: string) => {
      // Convert base64 to blob
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      const fileName = `${drawingName || "drawing"}-${Date.now()}.png`;
      const filePath = `${patientId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("patient-attachments")
        .upload(filePath, blob, { contentType: "image/png" });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("patient-attachments")
        .getPublicUrl(filePath);

      // Save attachment record
      const { error: dbError } = await supabase.from("attachments").insert({
        patient_id: patientId,
        surgery_id: surgeryId || null,
        file_name: fileName,
        file_url: publicUrlData.publicUrl,
        file_type: "drawing",
        mime_type: "image/png",
        attachment_type: "drawing",
        description: drawingName || "Drawing",
      });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-card-attachments", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-attachments", patientId] });
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      setOpen(false);
      setDrawingName("");
      setDrawingData(null);
      toast.success("Drawing saved");
    },
    onError: () => {
      toast.error("Failed to save drawing");
    },
  });

  const handleSaveDrawing = (dataUrl: string) => {
    setDrawingData(dataUrl);
    if (drawingName || dataUrl) {
      uploadDrawingMutation.mutate(dataUrl);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" />
            Create Drawing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Drawing</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="drawing-name" className="whitespace-nowrap">
              Drawing Name
            </Label>
            <Input
              id="drawing-name"
              value={drawingName}
              onChange={(e) => setDrawingName(e.target.value)}
              placeholder="e.g., Pre-op diagram"
              className="max-w-xs"
            />
          </div>

          <DrawingCanvas
            onSave={handleSaveDrawing}
            onCancel={() => setOpen(false)}
            width={800}
            height={500}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
