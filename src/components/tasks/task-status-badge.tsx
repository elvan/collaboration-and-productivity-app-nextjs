import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskStatusBadgeProps {
  status: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  todo: "bg-slate-500",
  in_progress: "bg-blue-500",
  done: "bg-green-500",
  canceled: "bg-red-500",
};

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  return (
    <Badge className={cn("capitalize", statusColors[status], className)}>
      {status.replace("_", " ")}
    </Badge>
  );
}
