import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  actions?: ReactNode;
}

export function SectionHeader({ title, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
