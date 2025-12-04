import { Users, Scissors, CheckCircle2, Clock } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { DataTable } from "@/components/dashboard/DataTable";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useDashboardData, Surgery, KanbanCard } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const surgeryColumns = [
  {
    key: "patients",
    header: "Patient",
    render: (surgery: Surgery) => (
      <div>
        <p className="font-medium text-foreground">{surgery.patients?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{surgery.patients?.medical_record_number ?? ""}</p>
      </div>
    ),
  },
  {
    key: "procedure_name",
    header: "Procedure",
    render: (surgery: Surgery) => (
      <span className="text-sm">{surgery.procedure_name}</span>
    ),
  },
  {
    key: "scheduled_date",
    header: "Date",
    render: (surgery: Surgery) => (
      <span className="text-sm">
        {surgery.scheduled_date
          ? format(new Date(surgery.scheduled_date), "MMM d, yyyy HH:mm")
          : "—"}
      </span>
    ),
  },
  {
    key: "surgeon",
    header: "Surgeon",
    render: (surgery: Surgery) => (
      <span className="text-sm">{surgery.surgeon ?? "—"}</span>
    ),
  },
  {
    key: "operating_room",
    header: "Room",
    render: (surgery: Surgery) => (
      <span className="text-sm">{surgery.operating_room ?? "—"}</span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (surgery: Surgery) => <StatusBadge status={surgery.status} />,
  },
];

const waitingListColumns = [
  {
    key: "patients",
    header: "Patient",
    render: (card: KanbanCard) => (
      <div>
        <p className="font-medium text-foreground">{card.patients?.name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{card.patients?.medical_record_number ?? ""}</p>
      </div>
    ),
  },
  {
    key: "kanban_boards",
    header: "Board",
    render: (card: KanbanCard) => (
      <span className="text-sm">{card.kanban_boards?.name ?? "—"}</span>
    ),
  },
  {
    key: "created_at",
    header: "Added",
    render: (card: KanbanCard) => (
      <span className="text-sm">
        {format(new Date(card.created_at), "MMM d, yyyy")}
      </span>
    ),
  },
  {
    key: "column_name",
    header: "Status",
    render: (card: KanbanCard) => <StatusBadge status={card.column_name} />,
  },
];

function KPICardSkeleton() {
  return (
    <div className="rounded-lg bg-muted p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    totalPatients,
    pendingSurgeries,
    completedThisMonth,
    waitingListCount,
    upcomingSurgeries,
    recentSurgeries,
    waitingList,
    isLoading,
  } = useDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Overview of surgical patient management
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            <>
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
              <KPICardSkeleton />
            </>
          ) : (
            <>
              <KPICard
                title="Total Patients"
                value={totalPatients}
                subtitle="Registered in system"
                icon={Users}
                variant="patients"
                onClick={() => console.log("Navigate to patients")}
              />
              <KPICard
                title="Pending Surgeries"
                value={pendingSurgeries}
                subtitle="Scheduled procedures"
                icon={Scissors}
                variant="surgeries"
                onClick={() => console.log("Navigate to pending surgeries")}
              />
              <KPICard
                title="Completed This Month"
                value={completedThisMonth}
                subtitle="Successfully performed"
                icon={CheckCircle2}
                variant="completed"
                onClick={() => console.log("Navigate to completed")}
              />
              <KPICard
                title="Waiting List"
                value={waitingListCount}
                subtitle="Patients awaiting surgery"
                icon={Clock}
                variant="waiting"
                onClick={() => console.log("Navigate to waiting list")}
              />
            </>
          )}
        </div>

        {/* Data Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DataTable
            title="Upcoming Surgeries"
            columns={surgeryColumns}
            data={upcomingSurgeries}
            emptyMessage="No upcoming surgeries scheduled"
            onRowClick={(surgery) => surgery.patients?.id && navigate(`/patient/${surgery.patients.id}`)}
          />
          
          <DataTable
            title="Recent Surgeries"
            columns={surgeryColumns}
            data={recentSurgeries}
            emptyMessage="No recent surgeries"
            onRowClick={(surgery) => surgery.patients?.id && navigate(`/patient/${surgery.patients.id}`)}
          />
        </div>

        <div className="mt-6">
          <DataTable
            title="Patients on Waiting List"
            columns={waitingListColumns}
            data={waitingList}
            emptyMessage="No patients on waiting list"
            onRowClick={(card) => card.patients?.id && navigate(`/patient/${card.patients.id}`)}
          />
        </div>
      </main>
    </div>
  );
}
