import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartCard({ title, children, actions, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
        </div>
      </div>
      <div className="p-4 pt-3">{children}</div>
    </div>
  );
}

