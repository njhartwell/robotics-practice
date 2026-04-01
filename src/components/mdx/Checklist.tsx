interface ChecklistProps {
  children: React.ReactNode;
}

export function Checklist({ children }: ChecklistProps) {
  return (
    <div className="my-4 border border-border rounded-lg p-4 bg-surface">
      <h4 className="text-sm font-semibold mb-2">Task Checklist</h4>
      <div className="text-sm space-y-1">{children}</div>
    </div>
  );
}
