import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Plus, RefreshCw, ArrowUpRight } from 'lucide-react';
import type { ContentOpportunityResponse } from '../../api/client';

interface ContentOpportunitiesTableProps {
  opportunities: ContentOpportunityResponse[];
}

const IMPACT_COLORS = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
  low: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
};

const ACTION_ICONS = {
  create: Plus,
  optimize: RefreshCw,
  expand: ArrowUpRight,
};

function OpportunityRow({ opp }: { opp: ContentOpportunityResponse }) {
  const [expanded, setExpanded] = useState(false);
  const impactStyle = IMPACT_COLORS[opp.impact];
  const ActionIcon = ACTION_ICONS[opp.action_type];

  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-1.5 rounded ${impactStyle.bg}`}>
          <ActionIcon className={`w-4 h-4 ${impactStyle.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--text-primary)] truncate">
            {opp.topic}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${impactStyle.bg} ${impactStyle.text}`}>
              {opp.action_type}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              {opp.effort_days <= 1 ? '< 1 day' : `~${opp.effort_days} days`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${impactStyle.bg} ${impactStyle.text} border ${impactStyle.border}`}>
            {opp.impact}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Content Brief
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {opp.content_brief}
            </p>
          </div>

          {opp.target_queries.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Target Queries
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {opp.target_queries.map((query, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] text-xs"
                  >
                    "{query}"
                  </span>
                ))}
              </div>
            </div>
          )}

          {opp.competitor_gap && (
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">
                Competitor Gap
              </span>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {opp.competitor_gap}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ContentOpportunitiesTable({ opportunities }: ContentOpportunitiesTableProps) {
  const [filter, setFilter] = useState<'all' | 'create' | 'optimize' | 'expand'>('all');

  const filteredOpps = filter === 'all'
    ? opportunities
    : opportunities.filter(o => o.action_type === filter);

  const sortedOpps = [...filteredOpps].sort((a, b) => {
    const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return impactOrder[a.impact] - impactOrder[b.impact];
  });

  return (
    <div className="card overflow-hidden">
      <div className="p-6 border-b border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">Content Opportunities</h3>
              <p className="text-xs text-[var(--text-muted)]">
                {opportunities.length} opportunities found
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {(['all', 'create', 'optimize', 'expand'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto">
        {sortedOpps.map((opp, idx) => (
          <OpportunityRow key={idx} opp={opp} />
        ))}
      </div>
    </div>
  );
}
