import { useState, useMemo } from 'react';

export interface PieChartData {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export function PieChart({
  data,
  height = 200,
  showLegend = true,
}: PieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { total, segments } = useMemo(() => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    if (totalValue === 0) {
      return { total: 0, segments: [] };
    }

    let currentAngle = -90; // Start at top
    const segmentsData = data.map((item, index) => {
      const percentage = (item.value / totalValue) * 100;
      const angle = (item.value / totalValue) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      // Calculate path for pie slice
      const radius = 40;
      const centerX = 50;
      const centerY = 50;
      
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArc = angle > 180 ? 1 : 0;
      
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        ...item,
        percentage,
        angle,
        startAngle,
        endAngle,
        path,
        color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
      };
    });

    return { total: totalValue, segments: segmentsData };
  }, [data]);

  if (data.length === 0 || total === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6" style={{ minHeight: height }}>
      <div className="flex-1">
        <svg
          viewBox="0 0 100 100"
          className="w-full"
          style={{ maxHeight: height }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {segments.map((segment, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <g key={index}>
                <path
                  d={segment.path}
                  fill={segment.color}
                  opacity={isHovered ? 0.8 : 1}
                  stroke="white"
                  strokeWidth="1"
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                />
                {/* Label in center if hovered */}
                {isHovered && (
                  <text
                    x="50"
                    y="50"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="6"
                    fill="#374151"
                    className="font-semibold"
                  >
                    {segment.percentage.toFixed(1)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {showLegend && (
        <div className="flex-1 space-y-2">
          {segments.map((segment, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm cursor-pointer transition-all ${
                  isHovered ? 'font-semibold' : ''
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-gray-700">{segment.label}</span>
                <span className="text-gray-500 ml-auto">
                  {segment.value} ({segment.percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


