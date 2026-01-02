/**
 * ImportKanban Component
 * 
 * Allows users to import Kanban boards from JSON files.
 * Expected JSON structure matches the database schema for boards, cards, and patients.
 */

import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Upload, FileJson, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImportedPatient {
  name: string;
  medical_record_number?: string;
  date_of_birth?: string;
  gender?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  notes?: string;
}

interface ImportedCard {
  column_name: string;
  position?: number;
  priority?: string;
  notes?: string;
  scheduled_date?: string;
  surgery_type?: string;
  patient: ImportedPatient;
}

interface ImportedKanban {
  name: string;
  description?: string;
  hospital?: string;
  service?: string;
  columns_config?: Array<{ id: string; name: string; color: string }>;
  cards?: ImportedCard[];
}

export function ImportKanban() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (data: ImportedKanban) => {
      // Create the board first
      const { data: board, error: boardError } = await supabase
        .from("kanban_boards")
        .insert({
          name: data.name,
          description: data.description,
          hospital: data.hospital,
          service: data.service,
          columns_config: data.columns_config || [
            { id: "waiting", name: "Waiting List", color: "gray" },
            { id: "scheduled", name: "Scheduled", color: "yellow" },
            { id: "operated", name: "Operated", color: "green" },
            { id: "follow_up", name: "Follow-up", color: "blue" },
          ],
        })
        .select()
        .single();

      if (boardError) throw boardError;

      // Import cards with their patients
      if (data.cards && data.cards.length > 0) {
        for (const card of data.cards) {
          // Check if patient already exists by MRN
          let patientId: string | null = null;

          if (card.patient.medical_record_number) {
            const { data: existingPatient } = await supabase
              .from("patients")
              .select("id")
              .eq("medical_record_number", card.patient.medical_record_number)
              .single();

            if (existingPatient) {
              patientId = existingPatient.id;
            }
          }

          // Create patient if not found
          if (!patientId) {
            const { data: newPatient, error: patientError } = await supabase
              .from("patients")
              .insert({
                name: card.patient.name,
                medical_record_number: card.patient.medical_record_number,
                date_of_birth: card.patient.date_of_birth,
                gender: card.patient.gender,
                contact_phone: card.patient.contact_phone,
                contact_email: card.patient.contact_email,
                address: card.patient.address,
                notes: card.patient.notes,
              })
              .select()
              .single();

            if (patientError) throw patientError;
            patientId = newPatient.id;
          }

          // Create the card
          const { error: cardError } = await supabase
            .from("kanban_cards")
            .insert({
              board_id: board.id,
              patient_id: patientId,
              column_name: card.column_name || "waiting",
              position: card.position || 0,
              priority: card.priority || "normal",
              notes: card.notes,
              scheduled_date: card.scheduled_date,
              surgery_type: card.surgery_type,
            });

          if (cardError) throw cardError;
        }
      }

      return { boardName: data.name, cardCount: data.cards?.length || 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      setResult({
        success: true,
        message: `Successfully imported "${result.boardName}" with ${result.cardCount} cards`,
      });
      toast.success("Kanban board imported successfully");
    },
    onError: (error: Error) => {
      setResult({
        success: false,
        message: `Import failed: ${error.message}`,
      });
      toast.error("Failed to import Kanban board");
    },
    onSettled: () => {
      setImporting(false);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a JSON file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ImportedKanban;

      if (!data.name) {
        throw new Error("JSON must have a 'name' field for the board");
      }

      importMutation.mutate(data);
    } catch (error) {
      setImporting(false);
      if (error instanceof SyntaxError) {
        setResult({ success: false, message: "Invalid JSON format" });
        toast.error("Invalid JSON format");
      } else {
        setResult({ success: false, message: (error as Error).message });
        toast.error((error as Error).message);
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sampleJson = {
    name: "Sample Kanban Board",
    description: "Example board for import",
    hospital: "General Hospital",
    service: "Orthopedics",
    columns_config: [
      { id: "waiting", name: "Waiting List", color: "gray" },
      { id: "scheduled", name: "Scheduled", color: "yellow" },
      { id: "operated", name: "Operated", color: "green" },
    ],
    cards: [
      {
        column_name: "waiting",
        priority: "high",
        patient: {
          name: "John Doe",
          medical_record_number: "MRN-12345",
          date_of_birth: "1980-05-15",
          gender: "Male",
          contact_phone: "+1234567890",
        },
      },
    ],
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Import Kanban Board</CardTitle>
        </div>
        <CardDescription>
          Import a Kanban board from a JSON file. Patients will be created or matched by medical record number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="kanban-import"
          />
          <Label htmlFor="kanban-import">
            <Button
              variant="outline"
              className="cursor-pointer"
              disabled={importing}
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {importing ? "Importing..." : "Select JSON File"}
              </span>
            </Button>
          </Label>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Expected JSON Format:</Label>
          <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto max-h-64">
            {JSON.stringify(sampleJson, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
