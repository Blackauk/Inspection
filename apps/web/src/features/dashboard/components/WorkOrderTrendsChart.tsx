import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from 'recharts';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface WorkOrderTrendsChartProps {
  data: TrendDataPoint[];
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
        <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
        <p className="text-sm text-gray-600">
          {data.value} work orders
        </p>
      </div>
    );
  }
  return null;
};

// Custom dot component for data points
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#3b82f6"
      stroke="#ffffff"
      strokeWidth={2}
    />
  );
};

export function WorkOrderTrendsChart({ data }: WorkOrderTrendsChartProps) {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No work orders for this period</p>
        </div>
      </div>
    );
  }

  // Format date for X-axis
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-full" style={{ height: '256px', width: '100%' }}>
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <YAxis
            label={{ value: 'Work Orders', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#6b7280' } }}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#6b7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          {/* Area fill with gradient */}
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#colorValue)"
            fillOpacity={1}
          />
          {/* Line on top */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

