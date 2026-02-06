import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
      <div className="card p-4 min-w-[180px] shadow-lg">
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
          {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-[var(--text-secondary)]">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold font-mono text-[var(--text-primary)]">
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

interface CustomLegendProps {
  brands: Brand[];
  visibleBrands: Set<string>;
  onToggle: (brandId: string) => void;
}

function CustomLegend({ brands, visibleBrands, onToggle }: CustomLegendProps) {
  return (
    <div className="flex items-center justify-center gap-6 pt-4 flex-wrap">
      {brands.map((brand) => {
        const isActive = visibleBrands.has(brand.id);
        return (
          <button
            key={brand.id}
            onClick={() => onToggle(brand.id)}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isActive ? 'opacity-100' : 'opacity-40'
            } hover:opacity-100 cursor-pointer`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: brand.color }}
            />
            <span className="text-sm text-[var(--text-secondary)]">{brand.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export function VisibilityChart({
  data,
  brands,
  animationDelay = 0,
}: VisibilityChartProps) {
  const [visibleBrands, setVisibleBrands] = useState<Set<string>>(
    new Set(brands.map(b => b.id))
  );

  const handleLegendClick = (brandId: string) => {
    setVisibleBrands(prev => {
      if (prev.size === 1 && prev.has(brandId)) {
        return new Set(brands.map(b => b.id));
      }
      return new Set([brandId]);
    });
  };

  return (
    <div
      className="card p-6 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Visibility Trend</h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Brand visibility over time</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
        >
          <defs>
            {brands.map((brand) => (
              <linearGradient key={brand.id} id={`color-${brand.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={brand.color} stopOpacity={0.2} />
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
            axisLine={{ stroke: 'var(--border-visible)' }}
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
            cursor={{ stroke: 'var(--accent-primary)', strokeOpacity: 0.2, strokeWidth: 1 }}
          />
          {brands.filter(b => visibleBrands.has(b.id)).map((brand) => (
            <Area
              key={brand.id}
              type="monotone"
              dataKey={brand.id}
              name={brand.name}
              stroke={brand.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color-${brand.id})`}
              dot={false}
              activeDot={{
                r: 5,
                strokeWidth: 2,
                stroke: 'var(--bg-primary)',
                fill: brand.color,
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      <CustomLegend
        brands={brands}
        visibleBrands={visibleBrands}
        onToggle={handleLegendClick}
      />
    </div>
  );
}
