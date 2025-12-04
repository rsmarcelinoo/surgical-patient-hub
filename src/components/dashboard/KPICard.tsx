import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  variant: "patients" | "surgeries" | "completed" | "waiting";
  onClick?: () => void;
}

const variantStyles = {
  patients: "kpi-gradient-patients",
  surgeries: "kpi-gradient-surgeries",
  completed: "kpi-gradient-completed",
  waiting: "kpi-gradient-waiting",
};

export function KPICard({ title, value, subtitle, icon: Icon, variant, onClick }: KPICardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative w-full rounded-lg p-5 text-left transition-all duration-200",
        "hover:shadow-kpi hover:-translate-y-0.5 active:translate-y-0",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "animate-fade-in cursor-pointer",
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary-foreground/80">{title}</p>
          <p className="text-3xl font-bold text-primary-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-primary-foreground/70">{subtitle}</p>
          )}
        </div>
        <div className="rounded-full bg-primary-foreground/20 p-2.5">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>
    </button>
  );
}
