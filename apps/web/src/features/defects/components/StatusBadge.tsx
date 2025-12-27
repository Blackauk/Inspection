import { Badge } from '../../../components/common/Badge';
import type { DefectStatus } from '../types';

interface StatusBadgeProps {
  status: DefectStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants: Record<DefectStatus, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    Draft: 'default',
    Open: 'info',
    Acknowledged: 'info',
    InProgress: 'warning',
    Deferred: 'default',
    Closed: 'success',
    Overdue: 'error',
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}
