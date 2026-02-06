import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Header } from '../components/layout/Header';
import { BrandsSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { useBrandsDetails } from '../hooks/useApi';
import { createBrand, type BrandCreateRequest, type BrandDetailResponse } from '../api/client';
import { config } from '../config';

const TREND_ICONS = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
};

const TREND_COLORS = {
  up: 'text-[var(--success)]',
  down: 'text-[var(--danger)]',
  stable: 'text-[var(--text-muted)]',
};

const SENTIMENT_COLORS = {
  positive: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e' },
  neutral: { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8' },
  negative: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
};

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (brand: BrandCreateRequest) => Promise<void>;
}

function AddBrandModal({ isOpen, onClose, onAdd }: AddBrandModalProps) {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [type, setType] = useState<'primary' | 'competitor'>('competitor');
  const [variations, setVariations] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNameChange = (value: string) => {
    setName(value);
    setId(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const variationsList = variations
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);

      if (variationsList.length === 0) {
        variationsList.push(name);
      }

      await onAdd({
        id,
        name,
        type,
        color,
        variations: variationsList,
      });

      setName('');
      setId('');
      setColor('#8b5cf6');
      setType('competitor');
      setVariations('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add brand');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md overflow-hidden animate-scale-in">
        {/* Modal Header - Campsite style */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Add New Brand</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Brand Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="e.g., Adobe Commerce"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Brand ID
            </label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors font-mono text-sm"
              placeholder="e.g., adobe-commerce"
              required
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Lowercase, no spaces. Auto-generated from name.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Search Variations
            </label>
            <input
              type="text"
              value={variations}
              onChange={(e) => setVariations(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              placeholder="e.g., Adobe Commerce, Magento, magento.com"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Comma-separated terms to search in AI responses.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'primary' | 'competitor')}
                className="w-full px-4 py-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
              >
                <option value="competitor">Competitor</option>
                <option value="primary">Primary</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                Color
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 rounded-lg cursor-pointer border border-[var(--border-subtle)]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border-visible)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] transition-all active:scale-98"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !id}
              className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[#1d4ed8] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

// Mobile card component for brands
interface BrandMobileCardProps {
  brand: BrandDetailResponse;
  isExpanded: boolean;
  onToggle: () => void;
}

function BrandMobileCard({ brand, isExpanded, onToggle }: BrandMobileCardProps) {
  const trendKey = brand.trend as keyof typeof TREND_ICONS;
  const TrendIcon = TREND_ICONS[trendKey] || TREND_ICONS.stable;
  const trendColor = TREND_COLORS[trendKey] || TREND_COLORS.stable;
  const sentimentStyle = SENTIMENT_COLORS[brand.sentiment as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.neutral;

  return (
    <div className={`mobile-list-item mobile-card-press bg-[var(--bg-primary)] border rounded-lg overflow-hidden animate-fade-in w-full ${
      isExpanded ? 'border-[var(--border-accent)] shadow-sm' : 'border-[var(--border-subtle)]'
    }`}>
      <div
        className="p-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Compact single row with key info */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: brand.color }}
            />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{brand.name}</span>
            {brand.type === 'primary' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-glow)] text-[var(--accent-primary)] font-semibold flex-shrink-0">
                You
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-sm font-semibold text-data tabular-nums">{brand.visibility}%</span>
            <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
            {brand.topPrompts.length > 0 && (
              <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                <ChevronRight className={`w-4 h-4 ${isExpanded ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
              </div>
            )}
          </div>
        </div>

        {/* Secondary info row - Campsite-style with pill badges */}
        <div className="flex items-center gap-2 mt-2 pl-5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-muted)]">
            <span className="font-mono text-[var(--text-secondary)] tabular-nums">{brand.avgPosition > 0 ? `#${brand.avgPosition.toFixed(1)}` : '-'}</span>
            <span className="ml-1">pos</span>
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[var(--bg-hover)] text-[10px] text-[var(--text-muted)]">
            <span className="text-[var(--text-secondary)] tabular-nums">{brand.totalMentions}</span>
            <span className="ml-1">mentions</span>
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-medium capitalize"
            style={{ backgroundColor: sentimentStyle.bg, color: sentimentStyle.text }}
          >
            {brand.sentiment}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] animate-fade-in">
          <div className="pt-4 space-y-4">
            {/* Top Prompts */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                Top Prompts
              </h4>
              <div className="space-y-1.5">
                {brand.topPrompts.slice(0, 3).map((prompt, idx) => (
                  <Link
                    key={idx}
                    to={`/prompts?query=${encodeURIComponent(prompt.query)}`}
                    className="mobile-list-item block p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[var(--text-primary)]">"{prompt.query}"</span>
                      {prompt.position && (
                        <span className="text-xs font-mono text-[var(--accent-primary)] flex-shrink-0 tabular-nums">
                          #{prompt.position}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
                {brand.topPrompts.length === 0 && (
                  <p className="text-[var(--text-muted)] text-sm py-2">No prompts found</p>
                )}
              </div>
            </div>

            {/* Variations */}
            {brand.variations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2">
                  Search Variations
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {brand.variations.map((v, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface BrandRowProps {
  brand: BrandDetailResponse;
  isExpanded: boolean;
  onToggle: () => void;
}

function BrandRow({ brand, isExpanded, onToggle }: BrandRowProps) {
  const trendKey = brand.trend as keyof typeof TREND_ICONS;
  const TrendIcon = TREND_ICONS[trendKey] || TREND_ICONS.stable;
  const trendColor = TREND_COLORS[trendKey] || TREND_COLORS.stable;
  const sentimentStyle = SENTIMENT_COLORS[brand.sentiment as keyof typeof SENTIMENT_COLORS] || SENTIMENT_COLORS.neutral;

  return (
    <>
      <tr
        className="border-b border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-4 px-4">
          {brand.topPrompts.length > 0 ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
            )
          ) : (
            <span className="w-4 h-4 block" />
          )}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: brand.color }}
            />
            <div>
              <span className="font-medium text-[var(--text-primary)]">{brand.name}</span>
              {brand.type === 'primary' && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)]">
                  You
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-4 px-4 text-center">
          <span className="text-data font-semibold">{brand.visibility}%</span>
        </td>
        <td className="py-4 px-4 text-center">
          <span className="text-[var(--text-secondary)] font-mono">
            {brand.avgPosition > 0 ? `#${brand.avgPosition.toFixed(1)}` : '-'}
          </span>
        </td>
        <td className="py-4 px-4 text-center">
          <TrendIcon className={`w-4 h-4 mx-auto ${trendColor}`} />
        </td>
        <td className="py-4 px-4 text-center">
          <span className="text-[var(--text-secondary)]">{brand.totalMentions}</span>
        </td>
        <td className="py-4 px-4 text-center">
          <span
            className="px-2 py-1 rounded-md text-xs font-medium capitalize"
            style={{ backgroundColor: sentimentStyle.bg, color: sentimentStyle.text }}
          >
            {brand.sentiment}
          </span>
        </td>
        <td className="py-4 px-4 text-center">
          {brand.type !== 'primary' && (
            <div className="relative group inline-block">
              <button
                className="p-2 rounded-lg text-[var(--text-muted)] cursor-not-allowed opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-[var(--bg-card)] shadow-md border border-[var(--border-subtle)] rounded-lg text-xs text-[var(--text-muted)] whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                Hands off my database!
              </div>
            </div>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-[var(--bg-hover)] px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Prompts */}
              <div>
                <h4 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                  Top Prompts for {brand.name}
                </h4>
                <div className="space-y-2">
                  {brand.topPrompts.slice(0, 5).map((prompt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-secondary)]"
                    >
                      <Link
                        to={`/prompts?query=${encodeURIComponent(prompt.query)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[var(--text-secondary)] text-sm flex-1 truncate mr-4 hover:text-[var(--accent-primary)] transition-colors"
                      >
                        "{prompt.query}"
                      </Link>
                      <div className="flex items-center gap-3">
                        {prompt.position && (
                          <span className="text-xs font-mono text-[var(--text-muted)]">
                            #{prompt.position}
                          </span>
                        )}
                        {prompt.sentiment && (
                          <span
                            className="text-xs px-2 py-0.5 rounded capitalize"
                            style={{
                              backgroundColor: SENTIMENT_COLORS[prompt.sentiment as keyof typeof SENTIMENT_COLORS]?.bg || SENTIMENT_COLORS.neutral.bg,
                              color: SENTIMENT_COLORS[prompt.sentiment as keyof typeof SENTIMENT_COLORS]?.text || SENTIMENT_COLORS.neutral.text,
                            }}
                          >
                            {prompt.sentiment}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {brand.topPrompts.length === 0 && (
                    <p className="text-[var(--text-muted)] text-sm">No prompts found</p>
                  )}
                </div>
              </div>

              {/* Visibility Trend Mini Chart */}
              <div>
                <h4 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wide mb-3">
                  Visibility Trend
                </h4>
                <div className="h-40 bg-[var(--bg-secondary)] rounded-lg p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={brand.visibilityByMonth}>
                      <defs>
                        <linearGradient id={`gradient-${brand.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={brand.color} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={brand.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="month"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                        }}
                        itemStyle={{ color: '#1f2937' }}
                        formatter={(value) => [`${value}%`, 'Visibility']}
                      />
                      <Area
                        type="monotone"
                        dataKey="visibility"
                        stroke={brand.color}
                        strokeWidth={2}
                        fill={`url(#gradient-${brand.id})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>Variations:</span>
                  {brand.variations.map((v, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type SortKey = 'visibility' | 'avgPosition' | 'totalMentions';

export function Brands() {
  const { data, loading, error, refetch } = useBrandsDetails();
  const [searchParams] = useSearchParams();
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const toast = useToast();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedBrands = useMemo(() => {
    if (!data?.brands || !sortKey || !sortDirection) return data?.brands || [];
    return [...data.brands].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return (aVal - bVal) * modifier;
    });
  }, [data?.brands, sortKey, sortDirection]);

  // Auto-expand selected brand from query param
  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected && data?.brands.some((b) => b.id === selected)) {
      setExpandedBrands(new Set([selected]));
    }
  }, [searchParams, data]);

  const toggleBrand = (brandId: string) => {
    setExpandedBrands((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brandId)) {
        newSet.delete(brandId);
      } else {
        newSet.add(brandId);
      }
      return newSet;
    });
  };

  const handleAddBrand = async (brandData: BrandCreateRequest) => {
    try {
      await createBrand(brandData);
      refetch();
      toast.success(`Brand "${brandData.name}" added successfully!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add brand');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Brand Management" subtitle="Track and manage brands in AI responses" />
        <BrandsSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <Header title="Brand Management" subtitle="Track and manage brands in AI responses" />
        <div className="p-8">
          <div className="card p-12 text-center">
            <p className="text-[var(--danger)] mb-2">Failed to load brands data</p>
            <p className="text-sm text-[var(--text-muted)]">
              Make sure the backend is running at {config.apiHost}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalBrands = data.brands.length;

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <Header title="Brand Management" subtitle="Track and manage brands in AI responses" />

      <div className="p-4 md:p-8">
        {/* Add Brand Button */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm sm:text-base font-medium hover:bg-[var(--accent-primary)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Brand</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 mb-6 overflow-hidden">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            All Brands ({totalBrands})
          </h3>
          {sortedBrands.map((brand) => (
            <BrandMobileCard
              key={brand.id}
              brand={brand}
              isExpanded={expandedBrands.has(brand.id)}
              onToggle={() => toggleBrand(brand.id)}
            />
          ))}
        </div>

        {/* Desktop Table View */}
        <div
          className="hidden md:block card p-6 animate-fade-in-up"
          style={{ animationDelay: '450ms' }}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
            All Brands ({totalBrands})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left text-sm font-medium text-[var(--text-muted)] pb-3 w-8"></th>
                  <th className="text-left text-sm font-medium text-[var(--text-muted)] pb-3">
                    Brand
                  </th>
                  <th
                    className="text-center text-sm font-medium text-[var(--text-muted)] pb-3 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
                    onClick={() => handleSort('visibility')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Visibility
                      {sortKey === 'visibility' ? (
                        <ChevronUp className={`w-3 h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      ) : (
                        <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-center text-sm font-medium text-[var(--text-muted)] pb-3 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
                    onClick={() => handleSort('avgPosition')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Avg. Position
                      {sortKey === 'avgPosition' ? (
                        <ChevronUp className={`w-3 h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      ) : (
                        <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="text-center text-sm font-medium text-[var(--text-muted)] pb-3">
                    Trend
                  </th>
                  <th
                    className="text-center text-sm font-medium text-[var(--text-muted)] pb-3 cursor-pointer hover:text-[var(--text-secondary)] transition-colors"
                    onClick={() => handleSort('totalMentions')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Mentions
                      {sortKey === 'totalMentions' ? (
                        <ChevronUp className={`w-3 h-3 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                      ) : (
                        <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />
                      )}
                    </div>
                  </th>
                  <th className="text-center text-sm font-medium text-[var(--text-muted)] pb-3">
                    Sentiment
                  </th>
                  <th className="text-center text-sm font-medium text-[var(--text-muted)] pb-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sortedBrands.map((brand) => (
                  <BrandRow
                    key={brand.id}
                    brand={brand}
                    isExpanded={expandedBrands.has(brand.id)}
                    onToggle={() => toggleBrand(brand.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Note */}
        <div
          className="card p-4 sm:p-6 mt-6 sm:mt-8 text-center animate-fade-in-up"
          style={{ animationDelay: '600ms' }}
        >
          <p className="text-[var(--text-muted)] text-xs sm:text-sm">
            Add new brands to track their mentions in AI responses. The system will automatically
            scan existing prompts and highlight mentions based on the search variations you provide.
          </p>
        </div>
      </div>

      {/* Add Brand Modal */}
      <AddBrandModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddBrand}
      />
    </div>
  );
}
