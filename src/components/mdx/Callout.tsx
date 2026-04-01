import { cn } from "@/lib/utils";
import { Info, AlertTriangle, Lightbulb } from "lucide-react";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  tip: Lightbulb,
};

const STYLES = {
  info: "border-primary/30 bg-primary/5",
  warning: "border-amber-400/30 bg-amber-50",
  tip: "border-green-400/30 bg-green-50",
};

interface CalloutProps {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}

export function Callout({ type = "info", children }: CalloutProps) {
  const Icon = ICONS[type];
  return (
    <div className={cn("my-4 border rounded-lg p-4 flex gap-3", STYLES[type])}>
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}
