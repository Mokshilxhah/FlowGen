import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#6366F1', '#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card p-3 text-xs">
        <p style={{ color: payload[0].payload.fill }} className="font-medium">
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export default function DonutChart({ data, height = 200, innerRadius = 50, outerRadius = 80, showLegend = true }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={3}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && (
          <Legend
            formatter={(value) => <span style={{ color: '#94A3B8', fontSize: 12 }}>{value}</span>}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
