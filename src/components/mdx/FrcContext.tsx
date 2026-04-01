interface FrcContextProps {
  children: React.ReactNode;
}

export function FrcContext({ children }: FrcContextProps) {
  return (
    <div className="my-4 border border-accent/30 bg-accent/5 rounded-lg p-4">
      <div className="text-xs font-semibold text-accent uppercase mb-1">
        FRC Context
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
