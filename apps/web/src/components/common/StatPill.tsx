interface StatPillProps {
  label: string;
  value: number | string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  onClick?: () => void;
}

export function StatPill({ label, value, severity = 'low', onClick }: StatPillProps) {
  const severityColors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border ${severityColors[severity]} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}
