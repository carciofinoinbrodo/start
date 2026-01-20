import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { FileQuestion, Plus } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
        {icon || <FileQuestion className="w-8 h-8 text-[var(--text-muted)]" />}
      </div>
      <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link
            to={actionHref}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white font-medium hover:bg-[var(--accent-primary)]/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}
