import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, ExternalLink, Loader2, Calendar, Hash } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { SentimentBadge } from '../components/ui/Badge';
import { usePrompts, useBrands, usePromptDetail } from '../hooks/useApi';
import type { PromptResponse } from '../api/client';

interface PromptBrandMention {
  brandId: string;
  brandName: string;
  position: number;
  mentioned: boolean;
  sentiment: string;
}

interface Brand {
  id: string;
  name: string;
  color: string;
}

function PromptRow({
  prompt,
  isExpanded,
  onToggle,
  index,
  brands
}: {
  prompt: PromptResponse;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
  brands: Brand[];
}) {
  const mentionedBrands = prompt.brands.filter((b) => b.mentioned);

  return (
    <>
      <tr
        onClick={onToggle}
        className="table-row-highlight cursor-pointer animate-fade-in"
        style={{ animationDelay: `${200 + index * 40}ms` }}
      >
        <td className="px-5 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-[var(--accent-primary)]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </div>
            <span className="text-sm text-[var(--text-primary)] font-medium">{prompt.query}</span>
          </div>
        </td>
        <td className="px-5 py-4 whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="progress-bar w-20">
              <div
                className="progress-bar-fill"
                style={{ width: `${prompt.visibility}%` }}
              />
            </div>
            <span className="text-sm font-semibold font-mono text-[var(--text-data)]">
              {prompt.visibility}%
            </span>
          </div>
        </td>
        <td className="px-5 py-4 whitespace-nowrap">
          <span className="text-sm font-mono text-[var(--text-secondary)]">
            {prompt.avgPosition > 0 ? `#${prompt.avgPosition}` : '-'}
          </span>
        </td>
        <td className="px-5 py-4 whitespace-nowrap">
          <span className="text-sm font-mono text-[var(--text-secondary)]">{prompt.totalMentions}</span>
        </td>
        <td className="px-5 py-4 whitespace-nowrap">
          <span className="text-sm font-mono text-[var(--accent-primary)]">{prompt.totalRuns}</span>
        </td>
        <td className="px-5 py-4 whitespace-nowrap">
          <div className="flex items-center -space-x-2">
            {mentionedBrands.slice(0, 4).map((mention) => {
              const brand = brands.find((b) => b.id === mention.brandId);
              return (
                <div
                  key={mention.brandId}
                  className="w-7 h-7 rounded-full border-2 border-[var(--bg-primary)] flex items-center justify-center text-[10px] font-semibold text-white transition-transform hover:scale-110 hover:z-10"
                  style={{
                    backgroundColor: brand?.color || '#6B7280',
                    boxShadow: `0 0 8px ${brand?.color || '#6B7280'}40`,
                  }}
                  title={mention.brandName}
                >
                  {mention.brandName.charAt(0)}
                </div>
              );
            })}
            {mentionedBrands.length > 4 && (
              <div className="w-7 h-7 rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-elevated)] flex items-center justify-center text-[10px] font-semibold text-[var(--text-muted)]">
                +{mentionedBrands.length - 4}
              </div>
            )}
          </div>
        </td>
      </tr>
      {isExpanded && (
        <ExpandedPromptDetail
          queryId={prompt.id}
          brands={brands}
        />
      )}
    </>
  );
}

function ExpandedPromptDetail({ queryId, brands }: { queryId: string; brands: Brand[] }) {
  const idx = parseInt(queryId.replace('query-', '').replace('prompt-', ''));
  const { data: detail, loading, error } = usePromptDetail(idx);
  const [selectedRunIndex, setSelectedRunIndex] = useState<number>(0);

  if (loading) {
    return (
      <tr className="animate-fade-in">
        <td colSpan={6} className="px-5 py-8 bg-[var(--bg-elevated)]/50">
          <div className="flex items-center justify-center gap-2 text-[var(--text-muted)]">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading details...
          </div>
        </td>
      </tr>
    );
  }

  if (error || !detail) {
    return (
      <tr className="animate-fade-in">
        <td colSpan={6} className="px-5 py-8 bg-[var(--bg-elevated)]/50">
          <div className="text-center text-red-400">Failed to load details</div>
        </td>
      </tr>
    );
  }

  const runs = detail.runs || [];
  const selectedRun = runs[selectedRunIndex] || runs[0];

  return (
    <tr className="animate-fade-in">
      <td colSpan={6} className="px-5 py-4 bg-[var(--bg-elevated)]/50">
        <div className="pl-6 space-y-6">
          {/* Aggregated Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Avg Visibility:</span>
              <span className="font-semibold text-[var(--text-data)]">{detail.visibility}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Avg Position:</span>
              <span className="font-semibold text-[var(--text-secondary)]">
                {detail.avgPosition > 0 ? `#${detail.avgPosition}` : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Total Runs:</span>
              <span className="font-semibold text-[var(--accent-primary)]">{detail.totalRuns}</span>
            </div>
          </div>

          {/* Run Selector */}
          {runs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Runs</h4>
              <div className="flex flex-wrap gap-2">
                {runs.map((run, index) => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRunIndex(index)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedRunIndex === index
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3" />
                      <span>Run {run.runNumber}</span>
                      <span className="text-xs opacity-75">({run.visibility}%)</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Run Details */}
          {selectedRun && (
            <div className="space-y-6 border-t border-[var(--border-subtle)] pt-4">
              {/* Run Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedRun.scrapedAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Visibility: </span>
                  <span className="font-semibold text-[var(--text-data)]">{selectedRun.visibility}%</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Position: </span>
                  <span className="font-semibold text-[var(--text-secondary)]">
                    {selectedRun.avgPosition > 0 ? `#${selectedRun.avgPosition}` : '-'}
                  </span>
                </div>
              </div>

              {/* Brand Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Brand Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedRun.brands.map((mention) => (
                    <BrandMentionCard key={mention.brandId} mention={mention} brands={brands} />
                  ))}
                </div>
              </div>

              {/* AI Response */}
              {selectedRun.responseText && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">AI Response</h4>
                  <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border-subtle)] max-h-96 overflow-y-auto">
                    <pre className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans leading-relaxed">
                      {selectedRun.responseText}
                    </pre>
                  </div>
                </div>
              )}

              {/* Sources */}
              {selectedRun.sources && selectedRun.sources.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                    Sources ({selectedRun.sources.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {selectedRun.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--border-accent)] transition-colors group"
                      >
                        <span className="text-xs font-mono text-[var(--text-muted)] mt-0.5">
                          [{source.citationOrder}]
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                              {source.title || source.domain}
                            </span>
                            <ExternalLink className="w-3 h-3 text-[var(--text-muted)] flex-shrink-0" />
                          </div>
                          <div className="text-xs text-[var(--text-muted)] mt-1">
                            {source.domain}
                            {source.publishedDate && ` • ${source.publishedDate}`}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

function BrandMentionCard({ mention, brands }: { mention: PromptBrandMention; brands: Brand[] }) {
  const brand = brands.find((b) => b.id === mention.brandId);

  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 ${
        mention.mentioned
          ? 'bg-[var(--bg-card)] border-[var(--border-subtle)] hover:border-[var(--border-accent)]'
          : 'bg-[var(--bg-elevated)]/50 border-transparent opacity-60'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: brand?.color || '#6B7280',
              boxShadow: mention.mentioned ? `0 0 8px ${brand?.color || '#6B7280'}40` : 'none',
            }}
          />
          <span className="text-sm font-medium text-[var(--text-primary)]">{mention.brandName}</span>
        </div>
        {mention.mentioned && <SentimentBadge sentiment={mention.sentiment as 'positive' | 'neutral' | 'negative'} />}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-[var(--text-muted)]">
          Position:{' '}
          <span className="font-semibold font-mono text-[var(--text-secondary)]">
            {mention.mentioned ? `#${mention.position}` : '-'}
          </span>
        </span>
        <span className="text-[var(--text-muted)]">
          Status:{' '}
          <span className={`font-semibold ${mention.mentioned ? 'text-[#4ade80]' : 'text-[var(--text-muted)]'}`}>
            {mention.mentioned ? 'Mentioned' : 'Not mentioned'}
          </span>
        </span>
      </div>
    </div>
  );
}

export function Prompts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: prompts, loading: promptsLoading, error: promptsError } = usePrompts();
  const { data: brandsData, loading: brandsLoading } = useBrands();

  const brands: Brand[] = useMemo(() => {
    if (!brandsData) return [];
    return brandsData.map(b => ({ id: b.id, name: b.name, color: b.color }));
  }, [brandsData]);

  const filteredPrompts = useMemo(() => {
    if (!prompts) return [];
    if (!searchQuery) return prompts;
    return prompts.filter((p) =>
      p.query.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prompts, searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isLoading = promptsLoading || brandsLoading;

  return (
    <div className="min-h-screen">
      <Header
        title="Prompts"
        subtitle="View brand mentions across AI-generated responses"
      />

      <div className="p-8">
        {/* Search */}
        <div className="mb-6 animate-fade-in-up delay-100">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark w-full pr-4 py-2.5 text-sm"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glass-card p-12 text-center animate-fade-in">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--accent-primary)]" />
            <p className="text-[var(--text-muted)]">Loading prompts...</p>
          </div>
        )}

        {/* Error State */}
        {promptsError && (
          <div className="glass-card p-12 text-center animate-fade-in">
            <p className="text-red-400 mb-2">Failed to load data</p>
            <p className="text-sm text-[var(--text-muted)]">Make sure the backend is running at localhost:8000</p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !promptsError && (
          <div className="glass-card overflow-hidden animate-fade-in-up delay-150">
            <div className="overflow-x-auto">
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Visibility</th>
                    <th>Avg Position</th>
                    <th>Mentions</th>
                    <th>Runs</th>
                    <th>Brands</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrompts.map((prompt, index) => (
                    <PromptRow
                      key={prompt.id}
                      prompt={prompt}
                      isExpanded={expandedId === prompt.id}
                      onToggle={() => toggleExpanded(prompt.id)}
                      index={index}
                      brands={brands}
                    />
                  ))}
                </tbody>
              </table>

              {filteredPrompts.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-[var(--text-muted)]">No prompts found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
