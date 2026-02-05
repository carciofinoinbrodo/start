import { Target, Lightbulb, AlertTriangle, Compass } from 'lucide-react';
import type { StrategicSummaryResponse } from '../../api/client';

interface StrategicSummaryCardProps {
  summary: StrategicSummaryResponse;
}

export function StrategicSummaryCard({ summary }: StrategicSummaryCardProps) {
  return (
    <div className="glass-card p-6 border-l-4 border-l-[var(--accent-primary)]">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">
        {summary.headline}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Lightbulb className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Key Insight
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.key_insight}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
          <div className="p-2 rounded-lg bg-green-500/20">
            <Target className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Biggest Opportunity
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.biggest_opportunity}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
          <div className="p-2 rounded-lg bg-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              Biggest Threat
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.biggest_threat}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Compass className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
              30-Day Focus
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.recommended_focus}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
