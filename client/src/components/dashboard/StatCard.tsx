interface StatCardProps {
  title: string;
  value: string | number;
  suffix?: string;
  icon?: React.ReactNode;
}

export default function StatCard({ title, value, suffix, icon }: StatCardProps) {
  return (
    <div className="p-6 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold">{value}</p>
        {suffix && <p className="ml-1 text-sm text-muted-foreground">{suffix}</p>}
      </div>
    </div>
  );
}
