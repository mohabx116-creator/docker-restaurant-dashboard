import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function AnalyticsChart({
  data,
  isLoading,
  hasActiveFilters,
  formatCurrency,
  formatAxisCurrency,
}) {
  if (isLoading && data.length === 0) {
    return <p className="status-message">Loading orders...</p>;
  }

  if (data.length === 0) {
    return (
      <p className="status-message">
        {hasActiveFilters
          ? "No revenue data matches the current filters."
          : "No orders yet. Add an order to reveal revenue performance."}
      </p>
    );
  }

  return (
    <div className="chart-stage">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 8, right: 12, left: -12, bottom: 8 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#F0DDD0"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={68}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={formatAxisCurrency}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => formatCurrency(value)}
            cursor={{ fill: "#FFEDD5" }}
          />
          <Bar dataKey="total" fill="#C2410C" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AnalyticsChart;
