"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ChecklistItem({ label, checked, onChange }: ChecklistItemProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        className={cn(
          "flex items-center justify-center w-5 h-5 rounded border-2 transition-all mt-0.5 flex-shrink-0",
          checked
            ? "bg-success border-success"
            : "border-border group-hover:border-primary/50"
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check size={14} className="text-white" />}
      </div>
      <span
        className={cn(
          "text-sm transition-colors",
          checked && "text-muted line-through"
        )}
      >
        {label}
      </span>
    </label>
  );
}
