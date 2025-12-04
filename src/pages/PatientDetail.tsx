import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, FileText, Stethoscope, MessageSquare, Paperclip, Activity } from "lucide-react";
import { format } from "date-fns";
import { PatientEpisodes } from "@/components/patient/PatientEpisodes";
import { PatientSurgeries } from "@/components/patient/PatientSurgeries";
import { PatientConsultations } from "@/components/patient/PatientConsultations";
import { PatientComments } from "@/components/patient/PatientComments";
import { PatientAttachments } from "@/components/patient/PatientAttachments";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <p className="text-muted-foreground">Patient not found</p>
          <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </main>
      </div>
    );
  }

  const age = patient.date_of_birth
    ? Math.floor((new Date().getTime() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Patient Header Card */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{patient.name}</CardTitle>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    {patient.medical_record_number && (
                      <span className="font-mono">MRN: {patient.medical_record_number}</span>
                    )}
                    {patient.gender && <Badge variant="secondary">{patient.gender}</Badge>}
                    {age !== null && <span>{age} years old</span>}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {patient.date_of_birth && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Born {format(new Date(patient.date_of_birth), "dd MMM yyyy")}</span>
                </div>
              )}
              {patient.contact_phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{patient.contact_phone}</span>
                </div>
              )}
              {patient.contact_email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{patient.contact_email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{patient.address}</span>
                </div>
              )}
            </div>
            {patient.notes && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
                <p className="text-muted-foreground">{patient.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="episodes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="episodes" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Episodes</span>
            </TabsTrigger>
            <TabsTrigger value="surgeries" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Surgeries</span>
            </TabsTrigger>
            <TabsTrigger value="consultations" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Consultations</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline">Attachments</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="episodes">
            <PatientEpisodes patientId={patient.id} />
          </TabsContent>

          <TabsContent value="surgeries">
            <PatientSurgeries patientId={patient.id} />
          </TabsContent>

          <TabsContent value="consultations">
            <PatientConsultations patientId={patient.id} />
          </TabsContent>

          <TabsContent value="comments">
            <PatientComments patientId={patient.id} />
          </TabsContent>

          <TabsContent value="attachments">
            <PatientAttachments patientId={patient.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
