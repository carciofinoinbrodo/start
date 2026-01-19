import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DailyVisibility, Brand } from '../../types';

interface VisibilityChartProps {
  data: DailyVisibility[];
  brands: Brand[];
  animationDelay?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-4 min-w-[180px]">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
                />
                <span className="text-sm text-[var(--text-secondary)]">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold font-mono text-[var(--text-data)]">
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

interface LegendPayloadItem {
  value: string;
  color?: string;
}

function CustomLegend({ payload }: { payload?: LegendPayloadItem[] }) {
  if (!payload) return null;

  return (
    <div className="flex items-center justify-center gap-6 pt-4 flex-wrap">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
          />
          <span className="text-sm text-[var(--text-secondary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function VisibilityChart({
  data,
  brands,
  animationDelay = 0,
}: VisibilityChartProps) {
  return (
    <div
      className="chart-container animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Visibility Trend</h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Brand visibility over time</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            {brands.map((brand) => (
              <linearGradient key={brand.id} id={`color-${brand.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand.color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={brand.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-subtle)' }}
            tickMargin={10}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            tickMargin={10}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'var(--accent-primary)', strokeOpacity: 0.3, strokeWidth: 1 }}
          />
          <Legend content={<CustomLegend />} />
          {brands.map((brand) => (
            <Area
              key={brand.id}
              type="monotone"
              dataKey={brand.id}
              name={brand.name}
              stroke={brand.color}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color-${brand.id})`}
              dot={false}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: 'var(--bg-primary)',
                fill: brand.color,
                style: {
                  filter: `drop-shadow(0 0 6px ${brand.color})`,
                },
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
