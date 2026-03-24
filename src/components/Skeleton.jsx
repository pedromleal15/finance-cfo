export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      <div className="skeleton h-4 w-24 mb-3 rounded" />
      <div className="skeleton h-8 w-32 mb-2 rounded" />
      <div className="skeleton h-3 w-20 rounded" />
    </div>
  )
}

export function SkeletonChart({ className = '' }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      <div className="skeleton h-5 w-40 mb-4 rounded" />
      <div className="skeleton h-64 w-full rounded" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, className = '' }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      <div className="skeleton h-5 w-40 mb-4 rounded" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton rounded ${className}`} />
}
