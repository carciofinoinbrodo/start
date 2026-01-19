import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { SentimentBadge } from '../components/ui/Badge';
import { prompts, brands } from '../data/mockData';
import type { Prompt, PromptBrandMention } from '../types';

function PromptRow({ prompt, isExpanded, onToggle, index }: {
  prompt: Prompt;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
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
        <tr className="animate-fade-in">
          <td colSpan={5} className="px-5 py-4 bg-[var(--bg-elevated)]/50">
            <div className="pl-6">
              <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Brand Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {prompt.brands.map((mention) => (
                  <BrandMentionCard key={mention.brandId} mention={mention} />
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function BrandMentionCard({ mention }: { mention: PromptBrandMention }) {
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
        {mention.mentioned && <SentimentBadge sentiment={mention.sentiment} />}
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

  const filteredPrompts = useMemo(() => {
    if (!searchQuery) return prompts;
    return prompts.filter((p) =>
      p.query.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

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

        {/* Table */}
        <div className="glass-card overflow-hidden animate-fade-in-up delay-150">
          <div className="overflow-x-auto">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Query</th>
                  <th>Visibility</th>
                  <th>Avg Position</th>
                  <th>Mentions</th>
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
      </div>
    </div>
  );
}
