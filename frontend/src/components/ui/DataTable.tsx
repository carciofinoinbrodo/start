import { useState, useMemo, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortKey?: keyof T;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  onEmptyAction?: () => void;
  emptyIcon?: ReactNode;
  animationDelay?: number;
  isPinned?: (item: T) => boolean;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  onEmptyAction,
  emptyIcon,
  animationDelay = 0,
  isPinned,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    const key = column.sortKey || (column.key as keyof T);

    if (sortKey === key) {
      // Toggle between asc and desc
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    // No sorting active - return original order
    if (!sortKey || !sortDirection) {
      return [...data];
    }

    // Create a copy and sort
    const result = [...data].sort((a, b) => {
      // If isPinned is provided, pinned items always come first
      if (isPinned) {
        const aPinned = isPinned(a);
        const bPinned = isPinned(b);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        // If both pinned or both not pinned, continue to regular sort
        // But if both are pinned, keep original order (don't sort between them)
        if (aPinned && bPinned) return 0;
      }

      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, sortKey, sortDirection, isPinned]);

  if (data.length === 0) {
    return (
      <div className="glass-card">
        <EmptyState
          icon={emptyIcon}
          title={emptyMessage}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          actionHref={emptyActionHref}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className="glass-card overflow-hidden animate-fade-in-up min-w-0"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="overflow-x-auto">
        <table className="table-dark w-full">
          <thead>
            <tr>
              {columns.map((column) => {
                const isActive = sortKey === (column.sortKey || column.key);
                return (
                  <th
                    key={column.key}
                    onClick={() => handleSort(column)}
                    className={`${column.className || ''} ${
                      column.align === 'right' ? 'text-right' :
                      column.align === 'center' ? 'text-center' : 'text-left'
                    } ${column.sortable ? 'cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors' : ''}`}
                  >
                    <div className={`flex items-center gap-1 ${
                      column.align === 'right' ? 'justify-end' :
                      column.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}>
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="flex flex-col">
                          {isActive && sortDirection === 'asc' && (
                            <ChevronUp className="w-3 h-3 text-[var(--accent-primary)]" />
                          )}
                          {isActive && sortDirection === 'desc' && (
                            <ChevronDown className="w-3 h-3 text-[var(--accent-primary)]" />
                          )}
                          {!isActive && (
                            <ChevronUp className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`table-row-highlight animate-fade-in ${
                  onRowClick ? 'cursor-pointer' : ''
                }`}
                style={{ animationDelay: `${animationDelay + 100 + index * 50}ms` }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap text-sm ${column.className || ''} ${
                      column.align === 'right' ? 'text-right font-mono' :
                      column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {column.render
                      ? column.render(item)
                      : String((item as Record<string, unknown>)[column.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
