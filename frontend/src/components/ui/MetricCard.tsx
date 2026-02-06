import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useBreakpoint } from '../../hooks/useMediaQuery';

interface MetricCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  delay?: number;
  linkTo?: string;
  linkLabel?: string;
  secondaryValue?: string | number;
  secondaryLabel?: string;
  /** Show compact version on mobile */
  compactOnMobile?: boolean;
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

export function MetricCard({ label, value, change, changeLabel, icon: Icon, delay = 0, linkTo, linkLabel, secondaryValue, secondaryLabel, compactOnMobile = false }: MetricCardProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';
  const isCompact = compactOnMobile && isMobile;

  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  const numericValue = typeof value === 'string'
    ? parseFloat(value.replace(/[^0-9.-]/g, ''))
    : value;

  const isPercentage = typeof value === 'string' && value.includes('%');
  const isPosition = typeof value === 'string' && value.includes('#');
  const prefix = isPosition ? '#' : '';
  const suffix = isPercentage ? '%' : '';

  const animatedValue = useCountUp(numericValue, 600, delay + 200);

  const displayValue = Number.isInteger(numericValue)
    ? `${prefix}${Math.round(animatedValue)}${suffix}`
    : `${prefix}${animatedValue.toFixed(1)}${suffix}`;

  // Compact mobile version - just the essentials
  if (isCompact) {
    return (
      <div
        className="card p-3 animate-fade-in-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[var(--bg-hover)]">
              <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">{label}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {change !== undefined && (
              <div className={`flex items-center ${
                isPositive ? 'text-[var(--success)]' : isNegative ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'
              }`}>
                {isPositive && <TrendingUp className="w-3 h-3" />}
                {isNegative && <TrendingDown className="w-3 h-3" />}
                {!isPositive && !isNegative && <Minus className="w-3 h-3" />}
              </div>
            )}
            <p className="text-lg font-semibold text-[var(--text-primary)]">{displayValue}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card p-4 md:p-5 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-2 md:mb-3">
        <p className="text-[12px] md:text-[13px] font-medium text-[var(--text-muted)]">{label}</p>
        <div className="p-1.5 md:p-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border-subtle)]">
          <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-muted)]" />
        </div>
      </div>

      <p className="text-xl md:text-[28px] font-semibold text-[var(--text-primary)] tracking-tight">{displayValue}</p>

      {secondaryValue !== undefined && (
        <div className="flex items-center gap-2 mt-2 md:mt-3 pt-2 md:pt-3 border-t border-[var(--border-subtle)]">
          <span className="text-sm md:text-base font-semibold font-mono text-[var(--text-secondary)]">
            {secondaryValue}
          </span>
          {secondaryLabel && (
            <span className="text-xs md:text-sm text-[var(--text-muted)]">{secondaryLabel}</span>
          )}
        </div>
      )}

      {change !== undefined && (
        <div className="flex items-center gap-1.5 md:gap-2 mt-2 md:mt-3">
          <div className={`flex items-center gap-1 text-xs md:text-sm font-medium ${
            isPositive
              ? 'text-[var(--success)]'
              : isNegative
                ? 'text-[var(--danger)]'
                : 'text-[var(--text-muted)]'
          }`}>
            {isPositive && <TrendingUp className="w-3 h-3 md:w-3.5 md:h-3.5" />}
            {isNegative && <TrendingDown className="w-3 h-3 md:w-3.5 md:h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3 h-3 md:w-3.5 md:h-3.5" />}
            <span>
              {isPositive && '+'}
              {change}
              {changeLabel}
            </span>
          </div>
          <span className="text-[10px] md:text-xs text-[var(--text-muted)]">vs last month</span>
        </div>
      )}

      {linkTo && (
        <div className="mt-3 md:mt-4 pt-2 md:pt-3 border-t border-[var(--border-subtle)]">
          <Link
            to={linkTo}
            className="flex items-center justify-center gap-1.5 w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg border border-[var(--border-visible)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs md:text-sm font-medium transition-all"
          >
            <span>{linkLabel || 'View'}</span>
            <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
