import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  className?: string
  count?: number
  type?: "card" | "text" | "avatar" | "button"
}

export function LoadingSkeleton({ className, count = 1, type = "card" }: LoadingSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        )
      case "text":
        return (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
        )
      case "avatar":
        return (
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        )
      case "button":
        return (
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        )
      default:
        return (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
          </div>
        )
    }
  }

  if (count === 1) {
    return (
      <div className={cn("animate-pulse", className)}>
        {renderSkeleton()}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn("animate-pulse", className)}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

export function ProviderCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-6 space-y-4", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="flex items-start gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mt-0.5 flex-shrink-0"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      </div>
      
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>
      
      <div className="flex gap-2 pt-2">
        <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
  )
}
