import { LucideIcon, Building2, Clock, AlertCircle, ClipboardList, FileText, Shield, XCircle, AlertTriangle } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'error' | 'info';
  onClick?: () => void;
  showViewLink?: boolean;
  icon?: LucideIcon;
  className?: string; // Allow custom className for active state styling
  accentColor?: 'blue' | 'green' | 'amber' | 'red' | 'gray'; // Subtle accent color (left border + icon/number color)
}

export function StatCard({ title, value, subtitle, badge, badgeVariant = 'info', onClick, showViewLink = false, icon: Icon, className = '', accentColor }: StatCardProps) {
  const badgeColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  // Accent color mappings (left border + icon/number color)
  const accentColorMap = {
    blue: { border: 'border-l-4 border-l-blue-500', icon: 'text-blue-600', value: 'text-blue-900' },
    green: { border: 'border-l-4 border-l-green-500', icon: 'text-green-600', value: 'text-green-900' },
    amber: { border: 'border-l-4 border-l-amber-500', icon: 'text-amber-600', value: 'text-amber-900' },
    red: { border: 'border-l-4 border-l-red-500', icon: 'text-red-600', value: 'text-red-900' },
    gray: { border: 'border-l-4 border-l-gray-400', icon: 'text-gray-500', value: 'text-gray-700' },
  };
  const accentStyles = accentColor && accentColor in accentColorMap
    ? accentColorMap[accentColor as keyof typeof accentColorMap]
    : { border: '', icon: 'text-gray-500', value: 'text-gray-900' };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`
        bg-white rounded-lg border border-gray-200 p-6
        transition-all duration-200
        ${accentStyles.border}
        ${onClick 
          ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' 
          : ''
        }
        ${!onClick ? 'shadow-sm' : 'shadow'}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {Icon && (
              <Icon className={`w-4 h-4 ${accentStyles.icon} flex-shrink-0`} aria-hidden="true" />
            )}
            <p className="text-sm font-medium text-gray-600 truncate">{title}</p>
          </div>
          <p className={`text-4xl font-extrabold mt-1 ${accentStyles.value}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
          {showViewLink && (
            <span className="text-xs text-blue-600 font-medium mt-2 inline-block">
              View →
            </span>
          )}
        </div>
        {badge && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${badgeColors[badgeVariant]}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
