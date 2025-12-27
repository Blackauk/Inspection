import React from 'react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value: number;
    payload?: any;
    color?: string;
  }>;
  label?: string;
  labelFormatter?: (label: any) => string;
  formatter?: (value: number, name?: string) => [React.ReactNode, string];
}

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const formattedLabel = labelFormatter && label !== undefined ? labelFormatter(label) : label;
  const displayLabel = formattedLabel !== undefined ? formattedLabel : label;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
      {displayLabel && (
        <p className="text-sm font-medium text-gray-900 mb-1">{displayLabel}</p>
      )}
      {payload.map((entry, index) => {
        const [formattedValue, formattedName] = formatter
          ? formatter(entry.value, entry.name)
          : [entry.value, entry.name || 'value'];
        
        return (
          <p key={index} className="text-sm text-gray-600">
            {formattedName}: <span className="font-semibold">{formattedValue}</span>
          </p>
        );
      })}
    </div>
  );
}

// Helper function to create a tooltip with custom formatters
export function createChartTooltip(
  labelFormatter?: (label: any) => string,
  formatter?: (value: number, name?: string) => [React.ReactNode, string]
) {
  return (props: ChartTooltipProps) => (
    <ChartTooltip {...props} labelFormatter={labelFormatter} formatter={formatter} />
  );
}

