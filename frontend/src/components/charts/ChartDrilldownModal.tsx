import { Modal } from '../ui/Modal';
import type { DailyVisibility, Brand } from '../../types';

interface ChartDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  data: DailyVisibility | null;
  brands: Brand[];
}

export function ChartDrilldownModal({
  isOpen,
  onClose,
  date,
  data,
  brands,
}: ChartDrilldownModalProps) {
  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  if (!data) return null;

  // Sort brands by visibility value for this day
  const sortedBrands = [...brands].sort((a, b) => {
    const aValue = (data[a.id] as number) || 0;
    const bValue = (data[b.id] as number) || 0;
    return bValue - aValue;
  });

  const topBrand = sortedBrands[0];
  const topValue = topBrand ? (data[topBrand.id] as number) || 0 : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Daily Visibility Breakdown" size="md">
      <div className="space-y-6">
        {/* Date Header */}
        <div className="text-center pb-4 border-b border-[var(--border-subtle)]">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{formattedDate}</p>
        </div>

        {/* Top Performer */}
        {topBrand && (
          <div className="p-4 rounded-xl bg-[var(--accent-glow)] border border-[var(--border-accent)]">
            <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
              Top Performer
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: topBrand.color, boxShadow: `0 0 8px ${topBrand.color}` }}
                />
                <span className="font-semibold text-[var(--text-primary)]">{topBrand.name}</span>
              </div>
              <span className="text-2xl font-bold font-mono text-[var(--accent-secondary)]">
                {topValue.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* All Brands Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--text-primary)]">All Brands</p>
          {sortedBrands.map((brand) => {
            const value = (data[brand.id] as number) || 0;
            return (
              <div
                key={brand.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-elevated)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: brand.color }}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">{brand.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${value}%`,
                        backgroundColor: brand.color,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold text-[var(--text-data)] w-14 text-right">
                    {value.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
