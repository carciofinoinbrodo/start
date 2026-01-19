import { useState } from 'react';
import { Eye, FileText, Globe, Hash } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/ui/MetricCard';
import { DataTable } from '../components/ui/DataTable';
import { TrendBadge, SentimentBadge } from '../components/ui/Badge';
import { VisibilityChart } from '../components/charts/VisibilityChart';
import { ChartDrilldownModal } from '../components/charts/ChartDrilldownModal';
import { brands, visibilityData, sources, metrics } from '../data/mockData';
import type { Brand, Source, DailyVisibility } from '../types';

const brandColumns = [
  {
    key: 'name',
    header: 'Brand',
    render: (brand: Brand) => (
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-3 rounded-full ring-2 ring-[var(--bg-primary)]"
          style={{ backgroundColor: brand.color, boxShadow: `0 0 8px ${brand.color}40` }}
        />
        <span className="font-medium text-[var(--text-primary)]">{brand.name}</span>
        {brand.type === 'primary' && (
          <span className="badge-glow badge-primary text-[10px] px-2 py-0.5 rounded-md">
            You
          </span>
        )}
      </div>
    ),
  },
  {
    key: 'visibility',
    header: 'Visibility',
    align: 'center' as const,
    render: (brand: Brand) => (
      <span className="text-data">{brand.visibility}%</span>
    ),
  },
  {
    key: 'trend',
    header: 'Trend',
    render: (brand: Brand) => <TrendBadge trend={brand.trend} />,
  },
  {
    key: 'sentiment',
    header: 'Sentiment',
    render: (brand: Brand) => <SentimentBadge sentiment={brand.sentiment} />,
  },
  {
    key: 'avgPosition',
    header: 'Avg Position',
    align: 'center' as const,
    render: (brand: Brand) => (
      <span className="text-[var(--text-secondary)] font-mono">#{brand.avgPosition.toFixed(1)}</span>
    ),
  },
];

const sourceColumns = [
  {
    key: 'domain',
    header: 'Source',
    render: (source: Source) => (
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="font-medium text-[var(--text-primary)]">{source.domain}</span>
      </div>
    ),
  },
  {
    key: 'usage',
    header: 'Usage',
    render: (source: Source) => (
      <div className="flex items-center gap-3">
        <div className="progress-bar w-24">
          <div
            className="progress-bar-fill"
            style={{ width: `${source.usage}%` }}
          />
        </div>
        <span className="text-sm font-mono text-[var(--text-secondary)]">{source.usage}%</span>
      </div>
    ),
  },
  {
    key: 'avgCitations',
    header: 'Avg Citations',
    align: 'center' as const,
    render: (source: Source) => (
      <span className="text-[var(--text-secondary)] font-mono">{source.avgCitations.toFixed(1)}</span>
    ),
  },
];

export function Dashboard() {
  // State for chart interactions
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonBrands, setComparisonBrands] = useState<string[]>([]);
  const [drilldownData, setDrilldownData] = useState<{
    date: string;
    data: DailyVisibility;
  } | null>(null);

  const handleComparisonToggle = () => {
    setComparisonMode((prev) => !prev);
    if (comparisonMode) {
      setComparisonBrands([]); // Reset selections when exiting comparison mode
    }
  };

  const handleBrandSelect = (brandId: string) => {
    setComparisonBrands((prev) => {
      if (prev.includes(brandId)) {
        return prev.filter((id) => id !== brandId);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection
        return [prev[1], brandId];
      }
      return [...prev, brandId];
    });
  };

  const handleDataPointClick = (date: string, data: DailyVisibility) => {
    setDrilldownData({ date, data });
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle="Track how AI search engines cite your brand vs competitors"
      />

      <div className="p-4 md:p-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <MetricCard
            label="Brand Visibility"
            value={`${metrics.visibility.value}%`}
            change={metrics.visibility.change}
            changeLabel="%"
            icon={Eye}
            delay={250}
          />
          <MetricCard
            label="Prompts Tracked"
            value={metrics.totalPrompts.value}
            icon={FileText}
            delay={300}
          />
          <MetricCard
            label="Sources Cited"
            value={metrics.totalSources.value}
            change={metrics.totalSources.change}
            icon={Globe}
            delay={350}
          />
          <MetricCard
            label="Avg Position"
            value={`#${metrics.avgPosition.value}`}
            change={metrics.avgPosition.change}
            icon={Hash}
            delay={400}
          />
        </div>

        {/* Visibility Chart - now interactive */}
        <div className="mb-8">
          <VisibilityChart
            data={visibilityData}
            brands={brands}
            timeRange="30d"
            animationDelay={500}
            comparisonMode={comparisonMode}
            comparisonBrands={comparisonBrands}
            onComparisonToggle={handleComparisonToggle}
            onBrandSelect={handleBrandSelect}
            onDataPointClick={handleDataPointClick}
          />
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 md:gap-8">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 animate-fade-in-up" style={{ animationDelay: '700ms' }}>
              Top Brands
            </h3>
            <DataTable
              columns={brandColumns}
              data={brands}
              keyExtractor={(brand) => brand.id}
              animationDelay={750}
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 animate-fade-in-up" style={{ animationDelay: '800ms' }}>
              Top Sources
            </h3>
            <DataTable
              columns={sourceColumns}
              data={sources.slice(0, 5)}
              keyExtractor={(source) => source.domain}
              animationDelay={850}
            />
          </div>
        </div>
      </div>

      {/* Drilldown Modal */}
      <ChartDrilldownModal
        isOpen={drilldownData !== null}
        onClose={() => setDrilldownData(null)}
        date={drilldownData?.date || ''}
        data={drilldownData?.data || null}
        brands={brands}
      />
    </div>
  );
}
