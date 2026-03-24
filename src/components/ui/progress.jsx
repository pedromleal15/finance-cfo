import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(
  ({ className, value, indicatorClassName, max = 100, ...props }, ref) => {
    const clamped = Math.min(Math.max(value ?? 0, 0), max)
    const percentage = (clamped / max) * 100

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-500 ease-out",
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
