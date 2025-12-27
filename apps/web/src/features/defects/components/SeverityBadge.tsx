import { Badge } from '../../../components/common/Badge';
import type { DefectSeverity, SeverityModel } from '../types';

interface SeverityBadgeProps {
  severity: DefectSeverity;
  severityModel: SeverityModel;
}

export function SeverityBadge({ severity, severityModel }: SeverityBadgeProps) {
  const getVariant = (): 'default' | 'warning' | 'error' => {
    if (severityModel === 'LMH') {
      if (severity === 'High') return 'error';
      if (severity === 'Medium') return 'warning';
      return 'default';
    } else {
      if (severity === 'Critical') return 'error';
      if (severity === 'Major') return 'warning';
      return 'default';
    }
  };

  return <Badge variant={getVariant()}>{severity}</Badge>;
}
