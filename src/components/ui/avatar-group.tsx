"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  maxCount?: number
}

export function AvatarGroup({
  children,
  maxCount = 4,
  className,
  ...props
}: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children)
  const visibleAvatars = childrenArray.slice(0, maxCount)
  const remainingCount = childrenArray.length - maxCount

  return (
    <div
      className={cn("flex -space-x-2", className)}
      {...props}
    >
      {visibleAvatars.map((child, index) => (
        <div
          key={index}
          className="relative inline-block border-2 border-background rounded-full"
        >
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-sm font-medium">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
