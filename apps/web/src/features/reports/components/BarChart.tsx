import { useState, useMemo } from 'react';

export interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  showGrid?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueLabel?: string;
}

export function BarChart({
  data,
  height = 200,
  showGrid = true,
  xAxisLabel = 'Category',
  yAxisLabel = 'Count',
  valueLabel = 'Count',
}: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { maxValue, yTicks } = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 100, yTicks: [0, 25, 50, 75, 100] };
    }
    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const paddedMax = Math.ceil(max * 1.1);
    const tickCount = 5;
    const tickStep = Math.ceil(paddedMax / tickCount);
    const ticks: number[] = [];
    for (let i = 0; i <= paddedMax; i += tickStep) {
      ticks.push(i);
    }
    return { maxValue: paddedMax, yTicks: ticks };
  }, [data]);

  if (data.length === 0) {
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

  const barWidth = 100 / data.length;
  const barSpacing = barWidth * 0.1;

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ minHeight: height - 60 }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Grid lines */}
        {showGrid &&
          yTicks.map((tick, i) => {
            const y = 100 - (tick / maxValue) * 100;
            return (
              <line
                key={i}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#f3f4f6"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const x = index * barWidth + barSpacing;
          const width = barWidth - barSpacing * 2;
          const y = 100 - barHeight;
          const isHovered = hoveredIndex === index;
          const color = item.color || '#3b82f6';

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={width}
                height={barHeight}
                fill={color}
                opacity={isHovered ? 0.8 : 1}
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
              />
              {/* Value label on bar */}
              {barHeight > 5 && (
                <text
                  x={x + width / 2}
                  y={y - 2}
                  textAnchor="middle"
                  fontSize="3"
                  fill="#374151"
                  className="font-medium"
                >
                  {item.value}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-500 px-2 mb-6" style={{ height: '20px' }}>
        {data.map((item, index) => {
          const position = (index + 0.5) * barWidth;
          const isHovered = hoveredIndex === index;
          return (
            <span
              key={index}
              className={`absolute transition-all ${
                isHovered ? 'font-semibold text-blue-600' : ''
              }`}
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {item.label.length > 10 ? item.label.substring(0, 10) + '...' : item.label}
            </span>
          );
        })}
      </div>

      {/* X-axis label */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-500 mb-1">
        {xAxisLabel}
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-12 flex flex-col justify-between text-xs text-gray-500 px-1">
        {yTicks.map((tick, i) => (
          <span key={i}>{tick}</span>
        ))}
      </div>

      {/* Y-axis label */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 -rotate-90 text-xs text-gray-500 whitespace-nowrap">
        {yAxisLabel}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none whitespace-nowrap"
          style={{
            left: `${(hoveredIndex + 0.5) * barWidth}%`,
            transform: 'translateX(-50%)',
            bottom: `${height - 60}px`,
          }}
        >
          <div className="font-semibold mb-1">{data[hoveredIndex].label}</div>
          <div>
            {valueLabel}: <span className="font-semibold">{data[hoveredIndex].value}</span>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}


