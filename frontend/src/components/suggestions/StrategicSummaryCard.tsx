import { Target, Lightbulb, AlertTriangle, Compass } from 'lucide-react';
import type { StrategicSummaryResponse } from '../../api/client';

interface StrategicSummaryCardProps {
  summary: StrategicSummaryResponse;
}

export function StrategicSummaryCard({ summary }: StrategicSummaryCardProps) {
  return (
    <div className="card p-6 border-l-4 border-l-[var(--accent-primary)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
        {summary.headline}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-visible)] border-l-4 border-l-[var(--accent-primary)]">
          <div className="p-2 rounded-lg bg-[var(--icon-bg)]">
            <Lightbulb className="w-4 h-4 text-[var(--accent-primary)]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Key Insight
            </span>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {summary.key_insight}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-visible)] border-l-4 border-l-[var(--success)]">
          <div className="p-2 rounded-lg bg-[var(--icon-bg)]">
            <Target className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Biggest Opportunity
            </span>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {summary.biggest_opportunity}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-visible)] border-l-4 border-l-[var(--danger)]">
          <div className="p-2 rounded-lg bg-[var(--icon-bg)]">
            <AlertTriangle className="w-4 h-4 text-[var(--danger)]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              Biggest Threat
            </span>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {summary.biggest_threat}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-visible)] border-l-4 border-l-[var(--warning)]">
          <div className="p-2 rounded-lg bg-[var(--icon-bg)]">
            <Compass className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
              30-Day Focus
            </span>
            <p className="text-sm text-[var(--text-primary)] mt-1">
              {summary.recommended_focus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
