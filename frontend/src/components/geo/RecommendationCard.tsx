import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, GripVertical } from 'lucide-react';
import type { Recommendation } from '../../api/client';

interface RecommendationCardProps {
  recommendation: Recommendation;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  content: { bg: 'bg-[var(--pastel-indigo)]', text: 'text-[var(--pastel-indigo-text)]', border: 'border-[var(--pastel-indigo-accent)]' },
  technical: { bg: 'bg-[var(--pastel-violet)]', text: 'text-[var(--pastel-violet-text)]', border: 'border-[var(--pastel-violet-accent)]' },
  outreach: { bg: 'bg-[var(--pastel-emerald)]', text: 'text-[var(--pastel-emerald-text)]', border: 'border-[var(--pastel-emerald-accent)]' },
  competitive: { bg: 'bg-[var(--pastel-amber)]', text: 'text-[var(--pastel-amber-text)]', border: 'border-[var(--pastel-amber-accent)]' },
};

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-[var(--status-error-bg)]', text: 'text-[var(--status-error-text)]', label: 'Critical' },
  high: { bg: 'bg-[var(--pastel-rose)]', text: 'text-[var(--pastel-rose-text)]', label: 'High' },
  medium: { bg: 'bg-[var(--status-warning-bg)]', text: 'text-[var(--status-warning-text)]', label: 'Medium' },
  low: { bg: 'bg-[var(--pastel-slate)]', text: 'text-[var(--pastel-slate-text)]', label: 'Low' },
};

export function RecommendationCard({ recommendation, isDragging, dragHandleProps }: RecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const category = categoryColors[recommendation.category] || categoryColors.content;
  const priority = priorityConfig[recommendation.priority] || priorityConfig.medium;

  return (
    <div
      {...dragHandleProps}
      className={`
        bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg
        transition-shadow duration-200 overflow-hidden cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-lg ring-2 ring-[var(--accent-primary)] opacity-90' : 'hover:border-[var(--border-accent)] hover:shadow-sm'}
      `}
    >
      {/* Header - Always visible */}
      <div className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag indicator */}
          <div className="mt-1 text-[var(--text-muted)]">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="text-sm font-medium text-[var(--text-primary)] leading-tight mb-2">
              {recommendation.title}
            </h4>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Priority badge */}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priority.bg} ${priority.text}`}>
                {priority.label}
              </span>

              {/* Category badge */}
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${category.bg} ${category.text} border ${category.border}`}>
                {recommendation.category}
              </span>

              {/* Effort */}
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-[var(--text-secondary)] bg-[var(--bg-hover)]">
                <Clock className="w-3 h-3" />
                {recommendation.effort}
              </span>
            </div>
          </div>

          {/* Expand button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-[var(--border-subtle)] pt-3 animate-fade-in">
          {/* Description */}
          <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
            {recommendation.description}
          </p>

          {/* Steps */}
          {recommendation.steps && recommendation.steps.length > 0 && (
            <div>
              <h5 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Implementation Steps
              </h5>
              <ol className="space-y-1.5">
                {recommendation.steps.map((step, index) => (
                  <li key={index} className="flex gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--bg-hover)] text-[var(--text-muted)] flex items-center justify-center text-[10px] font-medium">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
