import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  delay?: number;
  linkTo?: string;
  linkLabel?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function useCountUp(end: number, duration: number = 600, delay: number = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentValue = end * easedProgress;

        setCount(currentValue);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, delay]);

  return count;
}

export function MetricCard({ label, value, change, changeLabel, icon: Icon, delay = 0, linkTo, linkLabel }: MetricCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  // Parse numeric value for animation
  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, ''))
    : value;

  const isPercentage = typeof value === 'string' && value.includes('%');
  const isPosition = typeof value === 'string' && value.includes('#');
  const prefix = isPosition ? '#' : '';
  const suffix = isPercentage ? '%' : '';

  const animatedValue = useCountUp(numericValue, 600, delay + 200);

  // Format the animated value
  const displayValue = Number.isInteger(numericValue)
    ? `${prefix}${Math.round(animatedValue)}${suffix}`
    : `${prefix}${animatedValue.toFixed(1)}${suffix}`;

  return (
    <div
      className="glass-card p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-muted)] mb-2">{label}</p>
          <p className="text-metric">{displayValue}</p>
        </div>
        <div className="icon-glow">
          <Icon className="w-5 h-5 text-[var(--accent-primary)]" />
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
            isPositive
              ? 'bg-[var(--success)]/10 text-[#4ade80]'
              : isNegative
                ? 'bg-[var(--danger)]/10 text-[#f87171]'
                : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'
          }`}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
            <span className="text-sm font-semibold font-mono">
              {isPositive && '+'}
              {change}
              {changeLabel}
            </span>
          </div>
          <span className="text-xs text-[var(--text-muted)]">vs last month</span>
        </div>
      )}

      {linkTo && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <Link
            to={linkTo}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>{linkLabel || 'View'}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
