import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { FileQuestion, Plus, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Use secondary button style instead of primary */
  secondaryAction?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryAction = false,
  compact = false,
}: EmptyStateProps) {
  const buttonBaseClass = secondaryAction
    ? "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-visible)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all"
    : "flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-blue-700 transition-all shadow-sm";

  const ActionIcon = secondaryAction ? ArrowRight : Plus;

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-3' : 'py-16 px-4'}`}>
      {/* Icon container - Campsite style with subtle background */}
      <div className={`rounded-2xl bg-[var(--bg-hover)] border border-[var(--border-subtle)] flex items-center justify-center ${compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-5'}`}>
        {icon || <FileQuestion className={`text-[var(--text-muted)] ${compact ? 'w-6 h-6' : 'w-7 h-7'}`} />}
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-[var(--text-primary)] ${compact ? 'text-base mb-1' : 'text-lg mb-2'}`}>
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={`text-[var(--text-muted)] max-w-md leading-relaxed ${compact ? 'text-xs mb-4' : 'text-sm mb-6'}`}>
          {description}
        </p>
      )}

      {/* Action button - Campsite style */}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link to={actionHref} className={buttonBaseClass}>
            <ActionIcon className="w-4 h-4" />
            {actionLabel}
          </Link>
        ) : (
          <button onClick={onAction} className={buttonBaseClass}>
            <ActionIcon className="w-4 h-4" />
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
