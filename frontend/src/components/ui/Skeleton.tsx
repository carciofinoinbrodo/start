import type { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--bg-tertiary)] rounded ${className}`}
    />
  );
}

export function SkeletonText({ className = '' }: SkeletonProps) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonChart({ className = '' }: SkeletonProps) {
  return (
    <div className={`glass-card p-6 ${className}`}>
      <div className="mb-6">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-[350px] w-full rounded-lg" />
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
    <div className="glass-card overflow-hidden">
      <div className="p-6">
        <Skeleton className="h-5 w-32 mb-6" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <Skeleton className="h-4 w-20 mx-auto" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-[var(--border-subtle)]">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="px-5 py-4">
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
  return (
    <div className="p-4 md:p-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart */}
      <div className="mb-8">
        <SkeletonChart />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 md:gap-8">
        <SkeletonTable rows={5} cols={5} />
        <SkeletonTable rows={5} cols={3} />
      </div>
    </div>
  );
}

export function BrandsSkeleton() {
  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-end mb-6">
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={5} cols={8} />
    </div>
  );
}

export function PromptsSkeleton() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4 mb-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  );
}

export function SourcesSkeleton() {
  return (
    <div className="p-4 md:p-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8 mb-8">
        <div className="glass-card p-6">
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
