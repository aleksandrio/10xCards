export function SkeletonLoader() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="h-10 w-64 bg-muted rounded" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex gap-3 mt-8">
        <div className="h-10 w-36 bg-muted rounded" />
        <div className="h-10 w-40 bg-muted rounded" />
        <div className="h-10 w-36 bg-muted rounded" />
      </div>

      {/* Table skeleton - Desktop */}
      <div className="hidden md:block rounded-lg border overflow-hidden mt-8">
        <div className="bg-muted/50 px-4 py-3 flex gap-4">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded ml-auto" />
        </div>
        <div className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex gap-4">
              <div className="h-4 flex-1 bg-muted rounded" />
              <div className="h-4 flex-1 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Card skeleton - Mobile */}
      <div className="md:hidden space-y-3 mt-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3">
            <div>
              <div className="h-3 w-12 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded" />
            </div>
            <div>
              <div className="h-3 w-12 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-3/4 bg-muted rounded mt-1" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-8 flex-1 bg-muted rounded" />
              <div className="h-8 flex-1 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
