import { useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
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
import { BrandComparisonToggle } from './BrandComparisonToggle';
import type { DailyVisibility, Brand } from '../../types';

interface VisibilityChartProps {
  data: DailyVisibility[];
  brands: Brand[];
  timeRange?: '7d' | '30d' | '90d';
  animationDelay?: number;
  comparisonMode?: boolean;
  comparisonBrands?: string[];
  onComparisonToggle?: () => void;
  onBrandSelect?: (brandId: string) => void;
  onDataPointClick?: (date: string, data: DailyVisibility) => void;
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

type TimeRange = '7d' | '30d' | '90d';

export function VisibilityChart({
  data,
  brands,
  timeRange: initialTimeRange = '30d',
  animationDelay = 0,
  comparisonMode = false,
  comparisonBrands = [],
  onComparisonToggle,
  onBrandSelect,
  onDataPointClick,
}: VisibilityChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);

  const filteredData = (() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    return data.slice(-days);
  })();

  // Filter brands when in comparison mode
  const displayedBrands = comparisonMode && comparisonBrands.length > 0
    ? brands.filter(b => comparisonBrands.includes(b.id))
    : brands;

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const timeRanges: TimeRange[] = ['7d', '30d', '90d'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (chartData: any) => {
    if (onDataPointClick && chartData?.activePayload?.[0]?.payload) {
      const payload = chartData.activePayload[0].payload as DailyVisibility;
      onDataPointClick(payload.date, payload);
    }
  };

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
        <div className="flex items-center gap-3">
          {/* Comparison Mode Toggle */}
          {onComparisonToggle && (
            <button
              onClick={onComparisonToggle}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                comparisonMode
                  ? 'bg-[var(--accent-glow)] text-[var(--accent-secondary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--glass-bg)]'
              }`}
            >
              <GitCompareArrows className="w-4 h-4" />
              <span className="hidden sm:inline">Compare</span>
            </button>
          )}

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--bg-elevated)]">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-[var(--accent-glow)] text-[var(--accent-secondary)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Brand Selection in Comparison Mode */}
      {comparisonMode && onBrandSelect && (
        <BrandComparisonToggle
          brands={brands}
          selectedBrands={comparisonBrands}
          onToggle={onBrandSelect}
          maxSelection={2}
        />
      )}

      <ResponsiveContainer width="100%" height={350}>
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          onClick={handleChartClick}
          style={{ cursor: onDataPointClick ? 'pointer' : 'default' }}
        >
          <defs>
            {displayedBrands.map((brand) => (
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
            tickFormatter={formatXAxis}
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
          {displayedBrands.map((brand) => (
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
                  cursor: 'pointer',
                },
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Click hint */}
      {onDataPointClick && (
        <p className="text-xs text-[var(--text-muted)] text-center mt-4">
          Click on the chart to see daily breakdown
        </p>
      )}
    </div>
  );
}
