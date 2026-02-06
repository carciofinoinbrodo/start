import { useState } from 'react';
import { Wrench, CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import type { TechnicalCheckResponse } from '../../api/client';

interface TechnicalChecklistProps {
  checks: TechnicalCheckResponse[];
}

const STATUS_CONFIG = {
  done: {
    icon: CheckCircle,
    color: 'text-[var(--pastel-emerald-text)]',
    bg: 'bg-[var(--pastel-emerald)]',
    border: 'border-[var(--pastel-emerald-accent)]',
    label: 'Done',
  },
  missing: {
    icon: XCircle,
    color: 'text-[var(--pastel-rose-text)]',
    bg: 'bg-[var(--pastel-rose)]',
    border: 'border-[var(--pastel-rose-accent)]',
    label: 'Missing',
  },
  'needs-improvement': {
    icon: AlertTriangle,
    color: 'text-[var(--pastel-amber-text)]',
    bg: 'bg-[var(--pastel-amber)]',
    border: 'border-[var(--pastel-amber-accent)]',
    label: 'Needs Work',
  },
};

const PRIORITY_COLORS = {
  critical: 'text-[var(--pastel-rose-text)]',
  important: 'text-[var(--pastel-amber-text)]',
  'nice-to-have': 'text-[var(--pastel-indigo-text)]',
};

function CheckItem({ check }: { check: TechnicalCheckResponse }) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_CONFIG[check.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div
      className={`p-3 rounded-lg ${statusConfig.bg} border ${statusConfig.border} cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon className={`w-5 h-5 flex-shrink-0 ${statusConfig.color}`} />
          <div className="min-w-0">
            <p className="font-medium text-[var(--text-primary)] truncate">
              {check.check}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs capitalize ${PRIORITY_COLORS[check.priority]}`}>
                {check.priority}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                • {check.effort}
              </span>
            </div>
          </div>
        </div>

        {check.status !== 'done' && (
          expanded ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          )
        )}
      </div>

      {expanded && check.status !== 'done' && (
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            How to Fix
          </span>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {check.how_to_fix}
          </p>
        </div>
      )}
    </div>
  );
}

export function TechnicalChecklist({ checks }: TechnicalChecklistProps) {
  const doneCount = checks.filter(c => c.status === 'done').length;
  const totalCount = checks.length;
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const sortedChecks = [...checks].sort((a, b) => {
    const statusOrder = { missing: 0, 'needs-improvement': 1, done: 2 };
    const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 };

    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--pastel-slate)]">
            <Wrench className="w-5 h-5 text-[var(--pastel-slate-text)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Technical GEO Checklist</h3>
            <p className="text-xs text-[var(--text-muted)]">
              AI optimization requirements
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {doneCount}/{totalCount}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            {percentage}% complete
          </div>
        </div>
      </div>

      <div className="w-full h-2 bg-[var(--bg-hover)] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#059669] to-[#34D399] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="space-y-2">
        {sortedChecks.map((check, idx) => (
          <CheckItem key={idx} check={check} />
        ))}
      </div>
    </div>
  );
}
