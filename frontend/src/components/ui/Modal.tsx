import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Primary action button text */
  primaryAction?: string;
  /** Primary action handler */
  onPrimaryAction?: () => void;
  /** Secondary action button text (default: "Cancel") */
  secondaryAction?: string;
  /** Secondary action handler (default: onClose) */
  onSecondaryAction?: () => void;
  /** Whether primary action is loading */
  isLoading?: boolean;
  /** Whether primary action is disabled */
  isPrimaryDisabled?: boolean;
  /** Danger mode for destructive actions */
  danger?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  primaryAction,
  onPrimaryAction,
  secondaryAction = 'Cancel',
  onSecondaryAction,
  isLoading = false,
  isPrimaryDisabled = false,
  danger = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const hasFooter = primaryAction || onPrimaryAction;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`modal-content w-full ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Campsite style with refined spacing */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-subtle)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">{children}</div>

        {/* Footer - Campsite style with refined button spacing */}
        {hasFooter && (
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
            <button
              onClick={onSecondaryAction || onClose}
              className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-lg transition-all"
            >
              {secondaryAction}
            </button>
            {primaryAction && (
              <button
                onClick={onPrimaryAction}
                disabled={isPrimaryDisabled || isLoading}
                className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                  danger
                    ? 'bg-[var(--danger)] hover:bg-red-700'
                    : 'bg-[var(--accent-primary)] hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  primaryAction
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
