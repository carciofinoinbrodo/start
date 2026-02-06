import type { ReactNode } from 'react';
import { useBreakpoint } from '../../hooks/useMediaQuery';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-hover)] rounded ${className}`}
    />
  );
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard({ className = '', compact = false }: SkeletonProps & { compact?: boolean }) {
  if (compact) {
    return (
      <div className={`card p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    );
  }

  return (
    <div className={`card p-4 md:p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <Skeleton className="h-3 md:h-4 w-20 md:w-24" />
        <Skeleton className="h-7 w-7 md:h-9 md:w-9 rounded-lg" />
      </div>
      <Skeleton className="h-6 md:h-8 w-16 md:w-20 mb-2" />
      <Skeleton className="h-3 w-12 md:w-16" />
    </div>
  );
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="mb-6">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-[320px] w-full rounded-lg" />
      <div className="flex justify-center gap-6 mt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-5">
        <Skeleton className="h-5 w-32" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-visible)]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 bg-[var(--bg-secondary)]">
                <Skeleton className="h-4 w-20 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-[var(--border-subtle)]">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-4">
                  <Skeleton className={`h-4 ${colIdx === 0 ? 'w-32' : 'w-16 mx-auto'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DashboardSkeletonProps {
  children?: ReactNode;
}

export function DashboardSkeleton({}: DashboardSkeletonProps) {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (isMobile) {
    return (
      <div className="p-3">
        {/* Mobile: Compact 2x2 grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} compact />
          ))}
        </div>

        {/* Mobile: Compact list */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-3 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart */}
      <div className="mb-6">
        <SkeletonChart />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5 md:gap-6">
        <div>
          <Skeleton className="h-5 w-24 mb-3" />
          <SkeletonTable rows={5} cols={5} />
        </div>
        <div>
          <Skeleton className="h-5 w-24 mb-3" />
          <SkeletonTable rows={5} cols={3} />
        </div>
      </div>
    </div>
  );
}

export function BrandsSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-end mb-5">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={5} cols={8} />
    </div>
  );
}

export function PromptsSkeleton() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (isMobile) {
    return (
      <div className="p-3">
        <div className="flex flex-col gap-3 mb-4">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex items-center gap-4 pl-5">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <div className="flex -space-x-1">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-4 w-4 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}

export function SourcesSkeleton() {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === 'mobile';

  if (isMobile) {
    return (
      <div className="p-3">
        {/* Mobile: Compact 2x2 metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} compact />
          ))}
        </div>

        {/* Mobile: Compact lists */}
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 mb-6">
        <div className="card p-6">
          <Skeleton className="h-5 w-48 mb-6" />
          <Skeleton className="h-64 w-64 mx-auto rounded-full mb-6" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </div>
        <SkeletonTable rows={10} cols={4} />
      </div>

      {/* Full Table */}
      <SkeletonTable rows={10} cols={5} />
    </div>
  );
}
