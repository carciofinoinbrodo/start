import { useState } from 'react';
import { Users, AlertCircle, Clock, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import type { CompetitorGapResponse } from '../../api/client';

interface CompetitorGapsWidgetProps {
  gaps: CompetitorGapResponse[];
}

const URGENCY_CONFIG = {
  immediate: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: AlertCircle,
    label: 'Immediate'
  },
  'this-quarter': {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    icon: Clock,
    label: 'This Quarter'
  },
  'long-term': {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: Calendar,
    label: 'Long-term'
  },
};

const GAP_TYPE_COLORS = {
  content: 'bg-purple-500/20 text-purple-400',
  authority: 'bg-blue-500/20 text-blue-400',
  technical: 'bg-green-500/20 text-green-400',
  sentiment: 'bg-orange-500/20 text-orange-400',
};

function GapCard({ gap }: { gap: CompetitorGapResponse }) {
  const [expanded, setExpanded] = useState(false);
  const urgencyConfig = URGENCY_CONFIG[gap.urgency];
  const UrgencyIcon = urgencyConfig.icon;

  return (
    <div className={`p-4 rounded-lg ${urgencyConfig.bg} border ${urgencyConfig.border}`}>
      <div
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-primary)]">
              {gap.competitor}
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${GAP_TYPE_COLORS[gap.gap_type]}`}>
              {gap.gap_type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-xs ${urgencyConfig.color}`}>
              <UrgencyIcon className="w-3 h-3" />
              {urgencyConfig.label}
            </span>
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            )}
          </div>
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          {gap.description}
        </p>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
          <div>
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Action to Close
            </span>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {gap.action_to_close}
            </p>
          </div>

          {gap.evidence.length > 0 && (
            <div>
              <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                Evidence
              </span>
              <ul className="mt-2 space-y-1">
                {gap.evidence.map((ev, idx) => (
                  <li key={idx} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-[var(--text-muted)]">•</span>
                    {ev}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CompetitorGapsWidget({ gaps }: CompetitorGapsWidgetProps) {
  const immediateGaps = gaps.filter(g => g.urgency === 'immediate');
  const quarterGaps = gaps.filter(g => g.urgency === 'this-quarter');
  const longTermGaps = gaps.filter(g => g.urgency === 'long-term');

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-red-500/20">
          <Users className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Competitor Gaps</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Where competitors are outperforming
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {immediateGaps.map((gap, idx) => (
          <GapCard key={`immediate-${idx}`} gap={gap} />
        ))}
        {quarterGaps.map((gap, idx) => (
          <GapCard key={`quarter-${idx}`} gap={gap} />
        ))}
        {longTermGaps.map((gap, idx) => (
          <GapCard key={`longterm-${idx}`} gap={gap} />
        ))}
      </div>
    </div>
  );
}
