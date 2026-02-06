import { useMemo } from 'react';
import { Link } from 'react-router';
import { Eye, FileText, Globe, Hash, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/ui/MetricCard';
import { DataTable } from '../components/ui/DataTable';
import { TrendBadge, SentimentBadge } from '../components/ui/Badge';
import { VisibilityChart } from '../components/charts/VisibilityChart';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import { useBrands, useSources, useMetrics, useVisibilityData } from '../hooks/useApi';
import { useBreakpoint } from '../hooks/useMediaQuery';
import { config } from '../config';
import type { DailyVisibility } from '../types';

interface Brand {
  id: string;
  name: string;
  type: 'primary' | 'competitor';
  visibility: number;
  trend: 'up' | 'down' | 'stable';
  sentiment: 'positive' | 'neutral' | 'negative';
  avgPosition: number;
  color: string;
}

interface Source {
  domain: string;
  usage: number;
  avgCitations: number;
}

const brandColumns = [
  {
    key: 'name',
    header: 'Brand',
    sortable: true,
    render: (brand: Brand) => (
      <Link
        to={`/brands?selected=${brand.id}`}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: brand.color }}
        />
        <span className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">{brand.name}</span>
        {brand.type === 'primary' && (
          <span className="badge-primary text-[10px] px-2 py-0.5 rounded-full">
            You
          </span>
        )}
      </Link>
    ),
  },
  {
    key: 'visibility',
    header: 'Visibility',
    align: 'center' as const,
    sortable: true,
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
    sortable: true,
    render: (brand: Brand) => (
      <span className="text-[var(--text-secondary)] font-mono">#{brand.avgPosition.toFixed(1)}</span>
    ),
  },
];

const sourceColumns = [
  {
    key: 'domain',
    header: 'Source',
    sortable: true,
    render: (source: Source) => (
      <Link
        to={`/sources?domain=${encodeURIComponent(source.domain)}`}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] transition-colors">{source.domain}</span>
      </Link>
    ),
  },
  {
    key: 'usage',
    header: 'Usage',
    sortable: true,
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
    sortable: true,
    render: (source: Source) => (
      <span className="text-[var(--text-secondary)] font-mono">{source.avgCitations.toFixed(1)}</span>
    ),
  },
];

// Compact mobile card for brands - optimized for quick glances
function BrandMobileCard({ brand }: { brand: Brand }) {
  const TrendIcon = brand.trend === 'up' ? TrendingUp : brand.trend === 'down' ? TrendingDown : Minus;
  const trendColor = brand.trend === 'up' ? 'text-[var(--success)]' : brand.trend === 'down' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]';

  return (
    <Link
      to={`/brands?selected=${brand.id}`}
      className="mobile-list-item mobile-card-press flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-offset-2 ring-offset-[var(--bg-primary)]"
          style={{ backgroundColor: brand.color, boxShadow: `0 0 0 2px var(--bg-primary), 0 0 0 3px ${brand.color}30` }}
        />
        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{brand.name}</span>
        {brand.type === 'primary' && (
          <span className="badge-primary text-[9px] px-1.5 py-0.5 rounded flex-shrink-0">You</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-data tabular-nums">{brand.visibility}%</span>
        <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
      </div>
    </Link>
  );
}

// Compact mobile card for sources - optimized for quick glances
function SourceMobileCard({ source }: { source: Source }) {
  return (
    <Link
      to={`/sources?domain=${encodeURIComponent(source.domain)}`}
      className="mobile-list-item mobile-card-press flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-6 h-6 rounded-md bg-[var(--accent-glow)] flex items-center justify-center flex-shrink-0">
          <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{source.domain}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-10 h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
            style={{ width: `${source.usage}%` }}
          />
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)] tabular-nums w-8 text-right">{source.usage}%</span>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const { data: brandsData, loading: brandsLoading, error: brandsError } = useBrands();
  const { data: sourcesData, loading: sourcesLoading } = useSources();
  const { data: metricsData, loading: metricsLoading } = useMetrics();
  const { data: visibilityData, loading: visibilityLoading } = useVisibilityData();

  const brands: Brand[] = useMemo(() => {
    if (!brandsData) return [];
    return brandsData.map(b => ({
      id: b.id,
      name: b.name,
      type: b.type as 'primary' | 'competitor',
      visibility: b.visibility,
      trend: b.trend as 'up' | 'down' | 'stable',
      sentiment: b.sentiment as 'positive' | 'neutral' | 'negative',
      avgPosition: b.avgPosition,
      color: b.color,
    }));
  }, [brandsData]);

  const sources: Source[] = useMemo(() => {
    if (!sourcesData) return [];
    return sourcesData.map(s => ({
      domain: s.domain,
      usage: s.usage,
      avgCitations: s.avgCitations,
    }));
  }, [sourcesData]);

  const chartData: DailyVisibility[] = useMemo(() => {
    if (!visibilityData) return [];
    return visibilityData.map(d => ({
      date: d.date,
      shopify: d.shopify ?? 0,
      woocommerce: d.woocommerce ?? 0,
      bigcommerce: d.bigcommerce ?? 0,
      wix: d.wix ?? 0,
      squarespace: d.squarespace ?? 0,
    }));
  }, [visibilityData]);

  const isLoading = brandsLoading || sourcesLoading || metricsLoading || visibilityLoading;

  // Quick stats for mobile header
  const quickStats = metricsData ? [
    { label: 'Visibility', value: `${metricsData.visibility.value}%`, trend: (metricsData.visibility.change ?? 0) > 0 ? 'up' as const : (metricsData.visibility.change ?? 0) < 0 ? 'down' as const : 'stable' as const },
    { label: 'Position', value: `#${metricsData.avgPosition.value}`, trend: (metricsData.avgPosition.change ?? 0) < 0 ? 'up' as const : (metricsData.avgPosition.change ?? 0) > 0 ? 'down' as const : 'stable' as const },
  ] : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]">
        <Header
          title="Dashboard"
          subtitle="Track how AI search engines cite your brand vs competitors"
        />
        <DashboardSkeleton />
      </div>
    );
  }

  if (brandsError) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]">
        <Header
          title="Dashboard"
          subtitle="Track how AI search engines cite your brand vs competitors"
        />
        <div className="p-6 md:p-8">
          <div className="card p-12 text-center">
            <p className="text-[var(--danger)] mb-2">Failed to load data</p>
            <p className="text-sm text-[var(--text-muted)]">Make sure the backend is running at {config.apiHost}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] w-full overflow-x-hidden">
      <Header
        title="Dashboard"
        subtitle="Track how AI search engines cite your brand vs competitors"
        quickStats={quickStats}
      />

      <div className="p-3 md:p-6 lg:p-8">
        {/* Mobile: Compact 2x2 grid with just essentials */}
        {isMobile ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <MetricCard
              label="Visibility"
              value={`${metricsData?.visibility.value ?? 0}%`}
              change={metricsData?.visibility.change ?? 0}
              changeLabel="%"
              icon={Eye}
              delay={100}
              compactOnMobile
            />
            <MetricCard
              label="Position"
              value={`#${metricsData?.avgPosition.value ?? 0}`}
              change={metricsData?.avgPosition.change ?? 0}
              icon={Hash}
              delay={150}
              compactOnMobile
            />
            <MetricCard
              label="Prompts"
              value={metricsData?.totalPrompts.value ?? 0}
              icon={FileText}
              delay={200}
              compactOnMobile
            />
            <MetricCard
              label="Sources"
              value={metricsData?.totalSources.value ?? 0}
              icon={Globe}
              delay={250}
              compactOnMobile
            />
          </div>
        ) : (
          /* Desktop: Full metric cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
            <MetricCard
              label="Brand Visibility"
              value={`${metricsData?.visibility.value ?? 0}%`}
              change={metricsData?.visibility.change ?? 0}
              changeLabel="%"
              icon={Eye}
              delay={100}
            />
            <MetricCard
              label="Prompts Tracked"
              value={metricsData?.totalPrompts.value ?? 0}
              icon={FileText}
              delay={150}
              linkTo="/prompts"
              linkLabel="View Prompts"
            />
            <MetricCard
              label="Sources Cited"
              value={metricsData?.totalSources.value ?? 0}
              icon={Globe}
              delay={200}
              secondaryValue={metricsData?.totalSources.total ?? 0}
              secondaryLabel="total"
            />
            <MetricCard
              label="Avg Position"
              value={`#${metricsData?.avgPosition.value ?? 0}`}
              change={metricsData?.avgPosition.change ?? 0}
              icon={Hash}
              delay={250}
            />
          </div>
        )}

        {/* Visibility Chart - Hidden on mobile for cleaner view */}
        <div className={`mb-4 md:mb-6 ${isMobile ? 'hidden' : ''}`}>
          <VisibilityChart
            data={chartData}
            brands={brands}
            animationDelay={300}
          />
        </div>

        {/* Data Tables - Desktop */}
        <div className="hidden md:grid grid-cols-1 2xl:grid-cols-2 gap-5 md:gap-6">
          <div>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-3 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
              Top Brands
            </h3>
            <DataTable
              columns={brandColumns}
              data={brands}
              keyExtractor={(brand) => brand.id}
              animationDelay={450}
              isPinned={(brand) => brand.type === 'primary'}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Top Sources
              </h3>
              <Link
                to="/sources"
                className="flex items-center gap-1 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors font-medium"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <DataTable
              columns={sourceColumns}
              data={sources.slice(0, 5)}
              keyExtractor={(source) => source.domain}
              animationDelay={550}
            />
          </div>
        </div>

        {/* Mobile Card Views - Compact list style */}
        <div className="md:hidden space-y-4">
          {/* Top Brands - Mobile */}
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Brands</h3>
              <Link
                to="/brands"
                className="flex items-center gap-0.5 text-xs text-[var(--accent-primary)] font-medium"
              >
                <span>All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-1.5">
              {brands.slice(0, 4).map((brand) => (
                <BrandMobileCard key={brand.id} brand={brand} />
              ))}
            </div>
          </div>

          {/* Top Sources - Mobile */}
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Sources</h3>
              <Link
                to="/sources"
                className="flex items-center gap-0.5 text-xs text-[var(--accent-primary)] font-medium"
              >
                <span>All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-1.5">
              {sources.slice(0, 4).map((source) => (
                <SourceMobileCard key={source.domain} source={source} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
