import { useState, useMemo } from 'react';

export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  subtitle?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  valueLabel?: string; // e.g., "Work orders created" or "Work orders completed"
}

export function LineChart({
  data,
  height = 200,
  color = '#3b82f6',
  showGrid = true,
  subtitle,
  xAxisLabel = 'Date',
  yAxisLabel = 'Count',
  valueLabel = 'Count',
}: LineChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { maxValue, minValue, range, yTicks } = useMemo(() => {
    if (data.length === 0) {
      return { maxValue: 100, minValue: 0, range: 100, yTicks: [0, 25, 50, 75, 100] };
    }
    const values = data.map((d) => d.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const r = max - min || 1;
    
    // Calculate nice Y-axis ticks (always include 0 if possible)
    const paddedMax = Math.ceil(max + r * 0.1);
    const paddedMin = Math.max(0, Math.floor(min - r * 0.1));
    const tickRange = paddedMax - paddedMin;
    const tickCount = 5;
    const tickStep = Math.ceil(tickRange / tickCount);
    const ticks: number[] = [];
    for (let i = paddedMin; i <= paddedMax; i += tickStep) {
      ticks.push(i);
    }
    if (ticks[0] !== 0 && paddedMin <= 0) {
      ticks.unshift(0);
    }
    
    return {
      maxValue: paddedMax,
      minValue: paddedMin,
      range: paddedMax - paddedMin || 1,
      yTicks: ticks,
    };
  }, [data]);

  const points = useMemo(() => {
    if (data.length === 0) return '';
    const width = 100;
    const heightPercent = 100;
    const stepX = width / (data.length - 1 || 1);
    return data
      .map((point, index) => {
        const x = index * stepX;
        const y = heightPercent - ((point.value - minValue) / range) * heightPercent;
        return `${x},${y}`;
      })
      .join(' ');
  }, [data, minValue, range]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format date for tooltip
  const formatDateTooltip = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-gray-500 text-sm">No work order trend data for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
      )}

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ minHeight: height - 60 }} // Reserve space for labels
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Subtle grid lines */}
        {showGrid &&
          yTicks.map((tick, i) => {
            const y = 100 - ((tick - minValue) / range) * 100;
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

        {/* Hover guideline */}
        {hoveredIndex !== null && (
          <line
            x1={(hoveredIndex * 100) / (data.length - 1 || 1)}
            y1="0"
            x2={(hoveredIndex * 100) / (data.length - 1 || 1)}
            y2="100"
            stroke="#3b82f6"
            strokeWidth="0.5"
            strokeDasharray="2,2"
            opacity="0.5"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Data line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
          className="transition-all"
        />

        {/* Data points - subtle, only visible on hover */}
        {data.map((point, index) => {
          const width = 100;
          const heightPercent = 100;
          const stepX = width / (data.length - 1 || 1);
          const x = index * stepX;
          const y = heightPercent - ((point.value - minValue) / range) * heightPercent;
          const isHovered = hoveredIndex === index;
          
          return (
            <g key={index}>
              {/* Invisible larger hit area */}
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
                className="cursor-pointer"
              />
              {/* Visible point - only when hovered */}
              {isHovered && (
                <circle
                  cx={x}
                  cy={y}
                  r="3"
                  fill={color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* X-axis labels with hover highlight - show every date or spaced evenly */}
      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-500 px-2 mb-6" style={{ height: '20px' }}>
        {data.map((point, index) => {
          const isHovered = hoveredIndex === index;
          const totalWidth = 100;
          const stepX = totalWidth / (data.length - 1 || 1);
          const position = (index * stepX) / totalWidth * 100;
          
          // Show all dates if 7 days or fewer, otherwise show every nth date
          const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0 || index === data.length - 1;
          
          if (!showLabel) return null;
          
          return (
            <span
              key={index}
              className={`absolute transition-all ${
                isHovered ? 'font-semibold text-blue-600' : ''
              }`}
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
              onMouseEnter={() => setHoveredIndex(index)}
            >
              {formatDate(point.date)}
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

      {/* Y-axis label (rotated) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 -rotate-90 text-xs text-gray-500 whitespace-nowrap">
        {yAxisLabel}
      </div>

      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-10 pointer-events-none whitespace-nowrap"
          style={{
            left: `${(hoveredIndex / (data.length - 1 || 1)) * 100}%`,
            transform: 'translateX(-50%)',
            bottom: `${height - 60}px`,
          }}
        >
          <div className="font-semibold mb-1">
            {formatDateTooltip(data[hoveredIndex].date)}
          </div>
          <div>
            {valueLabel}: <span className="font-semibold">{data[hoveredIndex].value}</span>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
