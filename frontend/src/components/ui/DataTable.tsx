interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  animationDelay?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  animationDelay = 0,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-[var(--text-muted)]">{emptyMessage}</p>
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
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.className || ''} ${
                    column.align === 'right' ? 'text-right' :
                    column.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
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
