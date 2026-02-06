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
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--pastel-indigo)]">
          <div className="p-2 rounded-lg bg-[var(--pastel-indigo-accent)]">
            <Lightbulb className="w-4 h-4 text-[var(--pastel-indigo-text)]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--pastel-indigo-text)] uppercase tracking-wide">
              Key Insight
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.key_insight}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--pastel-emerald)]">
          <div className="p-2 rounded-lg bg-[var(--pastel-emerald-accent)]">
            <Target className="w-4 h-4 text-[var(--pastel-emerald-text)]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--pastel-emerald-text)] uppercase tracking-wide">
              Biggest Opportunity
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.biggest_opportunity}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--pastel-rose)]">
          <div className="p-2 rounded-lg bg-[var(--pastel-rose-accent)]">
            <AlertTriangle className="w-4 h-4 text-[var(--pastel-rose-text)]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--pastel-rose-text)] uppercase tracking-wide">
              Biggest Threat
            </span>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {summary.biggest_threat}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--pastel-violet)]">
          <div className="p-2 rounded-lg bg-[var(--pastel-violet-accent)]">
            <Compass className="w-4 h-4 text-[var(--pastel-violet-text)]" />
          </div>
          <div>
            <span className="text-xs font-medium text-[var(--pastel-violet-text)] uppercase tracking-wide">
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
