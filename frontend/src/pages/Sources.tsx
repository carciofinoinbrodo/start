import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { Globe, Database, Link2, BarChart3, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Header } from '../components/layout/Header';
import { MetricCard } from '../components/ui/MetricCard';
import { SourcesSkeleton } from '../components/ui/Skeleton';
import { useSourcesAnalytics } from '../hooks/useApi';
import { useBreakpoint } from '../hooks/useMediaQuery';
import { config } from '../config';

const TYPE_COLORS: Record<string, string> = {
  brand: '#f59e0b',
  blog: '#06b6d4',
  community: '#8b5cf6',
  news: '#ec4899',
  review: '#10b981',
  other: '#6b7280',
};

const TYPE_LABELS: Record<string, string> = {
  brand: 'Brand Sites',
  blog: 'Blog Posts',
  community: 'Community',
  news: 'News/Media',
  review: 'Review Sites',
  other: 'Other',
};

interface ExpandedSources {
  [key: number]: boolean;
}

// Compact mobile card for domain breakdown
interface DomainMobileCardProps {
  domain: {
    domain: string;
    citations: number;
    percentage: number;
    type: string;
  };
}

function DomainMobileCard({ domain }: DomainMobileCardProps) {
  return (
    <div className="mobile-list-item mobile-card-press flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-lg">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center flex-shrink-0">
          <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
        </div>
        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{domain.domain}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-semibold text-data tabular-nums">{domain.citations}</span>
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
          style={{
            backgroundColor: `${TYPE_COLORS[domain.type] || TYPE_COLORS.other}15`,
            color: TYPE_COLORS[domain.type] || TYPE_COLORS.other,
          }}
        >
          {TYPE_LABELS[domain.type] || domain.type}
        </span>
      </div>
    </div>
  );
}

// Compact mobile card for source list
interface SourceMobileCardProps {
  source: {
    id: number;
    domain: string;
    url: string;
    title?: string | null;
    citations: number;
    prompts: string[];
  };
  isExpanded: boolean;
  onToggle: () => void;
}

function SourceMobileCard({ source, isExpanded, onToggle }: SourceMobileCardProps) {
  return (
    <div className={`mobile-list-item mobile-card-press bg-[var(--bg-primary)] border rounded-lg overflow-hidden ${
      isExpanded ? 'border-[var(--border-accent)] shadow-sm' : 'border-[var(--border-subtle)]'
    }`}>
      <div className="p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-glow)] flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{source.domain}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-data tabular-nums">{source.citations}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--accent-primary)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {source.prompts.length > 0 && (
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                <ChevronRight className={`w-4 h-4 ${isExpanded ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
              </div>
            )}
          </div>
        </div>
        {source.title && (
          <p className="text-xs text-[var(--text-muted)] truncate mt-1.5 pl-9">{source.title}</p>
        )}
      </div>

      {isExpanded && source.prompts.length > 0 && (
        <div className="px-3 pb-3 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] animate-fade-in">
          <div className="pt-3">
            <span className="text-xs font-semibold text-[var(--text-primary)] block mb-2">Appears in prompts:</span>
            <div className="space-y-1.5">
              {source.prompts.slice(0, 3).map((prompt, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  <span className="line-clamp-2">"{prompt}"</span>
                </div>
              ))}
              {source.prompts.length > 3 && (
                <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">+{source.prompts.length - 3} more prompts</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sources() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  const { data, loading, error } = useSourcesAnalytics();
  const [searchParams] = useSearchParams();
  const [expandedSources, setExpandedSources] = useState<ExpandedSources>({});
  const sourceRefs = useRef<{ [key: number]: HTMLTableRowElement | null }>({});
  const hasScrolledRef = useRef(false);

  const chartData = useMemo(() => {
    if (!data?.sourceTypes) return [];
    return data.sourceTypes.map(st => ({
      name: TYPE_LABELS[st.type] || st.type,
      value: st.count,
      percentage: st.percentage,
      color: TYPE_COLORS[st.type] || TYPE_COLORS.other,
    }));
  }, [data]);

  useEffect(() => {
    const selectedDomain = searchParams.get('domain');
    if (selectedDomain && data?.topSources && !hasScrolledRef.current) {
      const source = data.topSources.find(
        (s) => s.domain.toLowerCase() === selectedDomain.toLowerCase()
      );
      if (source) {
        setExpandedSources({ [source.id]: true });
        setTimeout(() => {
          const row = sourceRefs.current[source.id];
          if (row) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            row.classList.add('ring-2', 'ring-[var(--accent-primary)]');
            setTimeout(() => {
              row.classList.remove('ring-2', 'ring-[var(--accent-primary)]');
            }, 2000);
          }
        }, 100);
        hasScrolledRef.current = true;
      }
    }
  }, [searchParams, data]);

  const toggleSource = (id: number) => {
    setExpandedSources(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]">
        <Header
          title="Sources Analytics"
          subtitle="Analyze citation sources from AI responses"
        />
        <SourcesSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)]">
        <Header
          title="Sources Analytics"
          subtitle="Analyze citation sources from AI responses"
        />
        <div className="p-6 md:p-8">
          <div className="card p-12 text-center">
            <p className="text-[var(--danger)] mb-2">Failed to load sources data</p>
            <p className="text-sm text-[var(--text-muted)]">Make sure the backend is running at {config.apiHost}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      <Header
        title="Sources Analytics"
        subtitle="Analyze citation sources from AI responses"
      />

      <div className="p-3 md:p-6 lg:p-8">
        {/* Summary Metrics - Compact on mobile */}
        {isMobile ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <MetricCard
              label="Sources"
              value={data.summary.totalSources}
              icon={Globe}
              delay={100}
              compactOnMobile
            />
            <MetricCard
              label="Domains"
              value={data.summary.totalDomains}
              icon={Database}
              delay={150}
              compactOnMobile
            />
            <MetricCard
              label="Citations"
              value={data.summary.totalCitations}
              icon={Link2}
              delay={200}
              compactOnMobile
            />
            <MetricCard
              label="Avg/Source"
              value={data.summary.avgCitationsPerSource.toFixed(1)}
              icon={BarChart3}
              delay={250}
              compactOnMobile
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
            <MetricCard
              label="Total Sources"
              value={data.summary.totalSources}
              icon={Globe}
              delay={100}
            />
            <MetricCard
              label="Unique Domains"
              value={data.summary.totalDomains}
              icon={Database}
              delay={150}
            />
            <MetricCard
              label="Total Citations"
              value={data.summary.totalCitations}
              icon={Link2}
              delay={200}
            />
            <MetricCard
              label="Avg Citations/Source"
              value={data.summary.avgCitationsPerSource.toFixed(1)}
              icon={BarChart3}
              delay={250}
            />
          </div>
        )}

        {/* Two Column Layout: Chart + Top Domains */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 mb-6">
          {/* Source Types Chart */}
          <div className="card p-4 sm:p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 sm:mb-6">
              Source Types Distribution
            </h3>
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 sm:w-64 sm:h-64 mb-4 sm:mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-visible)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{
                        color: 'var(--text-primary)',
                      }}
                      formatter={(value, name) => [`${value} sources`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-2 sm:space-y-3">
                {chartData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[var(--text-secondary)]">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <span className="text-[var(--text-muted)] text-xs sm:text-sm">{item.value}</span>
                      <span className="text-data font-medium w-10 sm:w-12 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Domains - Mobile Card View */}
          <div className="md:hidden animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
              Top Domains
            </h3>
            <div className="space-y-1.5">
              {data.domainBreakdown.slice(0, 5).map((domain) => (
                <DomainMobileCard key={domain.domain} domain={domain} />
              ))}
            </div>
          </div>

          {/* Top Domains Table - Desktop */}
          <div className="hidden md:block card p-6 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
              Top Domains by Citations
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-visible)]">
                    <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Domain</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Citations</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Share</th>
                    <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {data.domainBreakdown.slice(0, 10).map((domain) => (
                    <tr
                      key={domain.domain}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[var(--accent-primary)]" />
                          <span className="font-medium text-[var(--text-primary)]">{domain.domain}</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-data">{domain.citations}</span>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="progress-bar w-16">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(domain.percentage * 10, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-[var(--text-muted)]">{domain.percentage}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: `${TYPE_COLORS[domain.type] || TYPE_COLORS.other}15`,
                            color: TYPE_COLORS[domain.type] || TYPE_COLORS.other,
                          }}
                        >
                          {TYPE_LABELS[domain.type] || domain.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Full Sources - Mobile Card View */}
        <div className="md:hidden space-y-1.5 mt-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
            All Sources ({data.topSources.length})
          </h3>
          {data.topSources.slice(0, 10).map((source) => (
            <SourceMobileCard
              key={source.id}
              source={source}
              isExpanded={!!expandedSources[source.id]}
              onToggle={() => toggleSource(source.id)}
            />
          ))}
          {data.topSources.length > 10 && (
            <p className="text-xs text-center text-[var(--text-muted)] pt-2">
              +{data.topSources.length - 10} more sources
            </p>
          )}
        </div>

        {/* Full Sources Table - Desktop */}
        <div className="hidden md:block card p-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <h3 className="text-base font-semibold text-[var(--text-primary)] mb-6">
            All Sources ({data.topSources.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-visible)]">
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3 w-8"></th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Source</th>
                  <th className="text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Title</th>
                  <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Citations</th>
                  <th className="text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider pb-3">Prompts</th>
                </tr>
              </thead>
              <tbody>
                {data.topSources.map((source) => (
                  <>
                    <tr
                      key={source.id}
                      ref={(el) => { sourceRefs.current[source.id] = el; }}
                      className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
                      onClick={() => toggleSource(source.id)}
                    >
                      <td className="py-3">
                        {source.prompts.length > 0 && (
                          expandedSources[source.id] ? (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                          )
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-[var(--accent-primary)] flex-shrink-0" />
                          <span className="font-medium text-[var(--text-primary)]">{source.domain}</span>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-[var(--text-secondary)] text-sm truncate max-w-xs block">
                          {source.title || '-'}
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-data">{source.citations}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="text-[var(--text-muted)]">{source.prompts.length}</span>
                      </td>
                    </tr>
                    {expandedSources[source.id] && source.prompts.length > 0 && (
                      <tr key={`${source.id}-expanded`}>
                        <td colSpan={5} className="bg-[var(--bg-hover)] px-8 py-4">
                          <div className="text-sm">
                            <span className="text-[var(--text-muted)] mb-2 block">Appears in prompts:</span>
                            <ul className="space-y-1">
                              {source.prompts.map((prompt, idx) => (
                                <li key={idx} className="text-[var(--text-secondary)] flex items-start gap-2">
                                  <span className="text-[var(--accent-primary)]">•</span>
                                  <span>"{prompt}"</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
