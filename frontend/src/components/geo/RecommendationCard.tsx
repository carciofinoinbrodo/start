import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, GripVertical } from 'lucide-react';
import type { Recommendation } from '../../api/client';

interface RecommendationCardProps {
  recommendation: Recommendation;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  content: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-600' },
  technical: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-600' },
  outreach: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-600' },
  competitive: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-600' },
};

const priorityConfig: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Critical' },
  high: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', label: 'High' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', label: 'Medium' },
  low: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', label: 'Low' },
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
        transition-all duration-200 overflow-hidden cursor-grab active:cursor-grabbing
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
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700">
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
