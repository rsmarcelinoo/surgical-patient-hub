import { cn } from "@/lib/utils";

type StatusType = "scheduled" | "completed" | "cancelled" | "in-progress" | "waiting" | "active";

interface StatusBadgeProps {
  status: StatusType | string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-info/15 text-info border-info/30",
  },
  completed: {
    label: "Completed",
    className: "bg-success/15 text-success border-success/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-destructive/15 text-destructive border-destructive/30",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  waiting: {
    label: "Waiting",
    className: "bg-warning/15 text-warning border-warning/30",
  },
  active: {
    label: "Active",
    className: "bg-success/15 text-success border-success/30",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
