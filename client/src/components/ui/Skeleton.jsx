export default function Skeleton({ className = '', lines = 1, circle = false }) {
  if (circle) {
    return (
      <div className={`rounded-full bg-white/5 animate-pulse ${className}`} />
    );
  }

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`h-4 rounded-lg bg-white/5 animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-white/5 animate-pulse ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton circle className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton lines={3} />
    </div>
  );
}
