import { cn } from '@/lib/utils'

// Base skeleton block — everything builds on this
export function SkeletonBlock({ className = '' }) {
  return <div className={cn('skeleton', className)} />
}

// Single text line skeleton
export function SkeletonText({ lines = 1, className = '' }) {
  if (lines === 1) {
    return <div className={cn('skeleton h-3.5 rounded-full', className)} />
  }

  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3.5 rounded-full"
          style={{ width: i === lines - 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  )
}

// KPI / stat card skeleton
export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 space-y-3 overflow-hidden',
        className,
      )}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-3.5 w-24 rounded-full" />
        <div className="skeleton h-8 w-8 rounded-lg" />
      </div>

      {/* Main value */}
      <div className="skeleton h-8 w-36 rounded-lg" />

      {/* Sub-label / trend */}
      <div className="flex items-center gap-2">
        <div className="skeleton h-3 w-12 rounded-full" />
        <div className="skeleton h-3 w-20 rounded-full" />
      </div>
    </div>
  )
}

// Chart area skeleton
export function SkeletonChart({ className = '' }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 overflow-hidden',
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-2">
          <div className="skeleton h-4 w-40 rounded-full" />
          <div className="skeleton h-3 w-24 rounded-full" />
        </div>
        <div className="skeleton h-8 w-28 rounded-lg" />
      </div>

      {/* Chart area with simulated bars */}
      <div className="flex items-end gap-2 h-48 px-2">
        {[65, 45, 80, 55, 70, 40, 85, 60, 75, 50, 90, 45].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="skeleton rounded-t-md"
              style={{ height: `${h}%` }}
            />
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-2 mt-3 px-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 skeleton h-2.5 rounded-full" />
        ))}
      </div>
    </div>
  )
}

// Table skeleton
export function SkeletonTable({ rows = 5, className = '' }) {
  const colWidths = ['w-24', 'flex-1', 'w-20', 'w-28', 'w-16']

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        className,
      )}
    >
      {/* Table header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="skeleton h-4 w-40 rounded-full" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>

      {/* Column headers */}
      <div className="px-5 py-3 border-b border-border/50 flex items-center gap-4">
        {colWidths.map((w, i) => (
          <div key={i} className={cn('skeleton h-3 rounded-full', w)} />
        ))}
      </div>

      {/* Data rows */}
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="px-5 py-3.5 flex items-center gap-4"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Date badge */}
            <div className="skeleton h-4 w-24 rounded-full" />
            {/* Description */}
            <div className="skeleton h-4 flex-1 rounded-full" style={{ maxWidth: `${60 + (i % 3) * 15}%` }} />
            {/* Amount */}
            <div className="skeleton h-4 w-20 rounded-full" />
            {/* Category pill */}
            <div className="skeleton h-6 w-28 rounded-full" />
            {/* Type badge */}
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Dashboard grid skeleton — combines cards + chart + table
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* KPI cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      {/* Chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonChart />
      </div>

      {/* Table */}
      <SkeletonTable rows={6} />
    </div>
  )
}
