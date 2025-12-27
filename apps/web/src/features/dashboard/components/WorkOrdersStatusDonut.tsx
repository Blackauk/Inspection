import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface WorkOrderByStatus {
  status: string;
  count: number;
  percentage: number;
}

interface WorkOrdersStatusDonutProps {
  data: WorkOrderByStatus[];
}

const COLORS = {
  'Open': '#ef4444', // red-500
  'In Progress': '#eab308', // yellow-500
  'Waiting Parts': '#3b82f6', // blue-500
  'Completed': '#22c55e', // green-500
};

const getStatusColor = (status: string): string => {
  return COLORS[status as keyof typeof COLORS] || '#6b7280';
};

// Custom label component to show value and percentage on segments
const renderCustomLabel = (entry: any, total: number) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, value } = entry;
  const RADIAN = Math.PI / 180;
  // Position label at mid-radius (between inner and outer) to ensure it's inside the segment
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const percentage = Math.round((value / total) * 100);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
      style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
    >
      {value} ({percentage}%)
    </text>
  );
};

export function WorkOrdersStatusDonut({ data }: WorkOrdersStatusDonutProps) {
  // Calculate total and ensure percentages are whole numbers
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Handle empty state
  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No work orders yet</p>
        </div>
      </div>
    );
  }

  // Transform data for recharts with calculated percentages and total for label calculation
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
    percentage: Math.round((item.count / total) * 100),
    total: total,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = Math.round((data.value / total) * 100);
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          <p className="text-sm font-medium text-gray-900">
            {data.name}: {data.value} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Order legend items: Open, In Progress, Completed, Waiting Parts
  const legendOrder = ['Open', 'In Progress', 'Completed', 'Waiting Parts'];
  const orderedChartData = legendOrder.map((status) => 
    chartData.find((d) => d.name === status)
  ).filter(Boolean);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
      {/* Left: Donut Chart */}
      <div className="relative flex-shrink-0" style={{ width: '280px', height: '280px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              label={(entry) => renderCustomLabel(entry, total)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label showing total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600">Total</div>
            <div className="text-3xl font-bold text-gray-900">{total}</div>
          </div>
        </div>
      </div>

      {/* Right: Legend - centered vertically */}
      <div className="flex-shrink-0">
        <div className="flex flex-col justify-center space-y-3">
          {orderedChartData.map((item) => {
            if (!item) return null;
            return (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getStatusColor(item.name) }}
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-medium text-gray-700">{item.name}:</span>
                  <span className="text-sm text-gray-600">
                    {item.value} ({item.percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

