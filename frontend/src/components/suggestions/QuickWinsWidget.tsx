import { useState } from 'react';
import { Zap, ChevronDown, ChevronUp, Clock, CheckCircle2 } from 'lucide-react';
import type { QuickWinResponse } from '../../api/client';

interface QuickWinsWidgetProps {
  quickWins: QuickWinResponse[];
}

function EffortBadge({ hours }: { hours: number }) {
  const label = hours <= 1 ? '< 1h' : hours <= 2 ? '~2h' : hours <= 4 ? '~4h' : `~${hours}h`;
  const color = hours <= 2
    ? 'text-[var(--status-success-text)] bg-[var(--status-success-bg)]'
    : hours <= 4
      ? 'text-[var(--status-warning-text)] bg-[var(--status-warning-bg)]'
      : 'text-[var(--status-error-text)] bg-[var(--status-error-bg)]';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Clock className="w-3 h-3" />
      {label}
    </span>
  );
}

function QuickWinItem({ win, index }: { win: QuickWinResponse; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 rounded-lg bg-[var(--container-subtle)] border border-[var(--border-subtle)]">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-[var(--text-primary)]">
              {win.action}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <EffortBadge hours={win.effort_hours} />
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </div>
          </div>

          {win.target_page && (
            <p className="text-xs text-[var(--text-muted)] mt-1 truncate">
              Target: {win.target_page}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-2 text-sm text-[var(--text-secondary)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
            <span>{win.expected_outcome}</span>
          </div>
        </div>
      </div>

      {expanded && win.steps.length > 0 && (
        <div className="mt-4 ml-9 pl-4 border-l-2 border-[var(--border-subtle)]">
          <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
            Implementation Steps
          </span>
          <ol className="mt-2 space-y-2">
            {win.steps.map((step, stepIdx) => (
              <li key={stepIdx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">{stepIdx + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function QuickWinsWidget({ quickWins }: QuickWinsWidgetProps) {
  return (
    <div className="card p-6 h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-[var(--icon-bg)]">
          <Zap className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
        <div>
          <h3 className="font-semibold text-[var(--text-primary)]">Quick Wins</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Actions you can complete today
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {quickWins.map((win, idx) => (
          <QuickWinItem key={idx} win={win} index={idx} />
        ))}
      </div>
    </div>
  );
}
