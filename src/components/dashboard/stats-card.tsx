import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: number
  description?: string
  icon?: React.ReactNode
  trend?: string
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon,
  trend,
  className 
}: StatsCardProps) {
  const trendValue = trend ? parseFloat(trend) : 0
  const isPositive = trendValue >= 0

  return (
    <Card className={cn("transition-all duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && (
          <div className="h-8 w-8 rounded-full bg-primary/10 p-2 text-primary">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-3">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={cn(
              "flex items-center text-sm",
              isPositive ? "text-green-500" : "text-red-500"
            )}>
              {isPositive ? (
                <ArrowUpIcon className="mr-1 h-3 w-3" />
              ) : (
                <ArrowDownIcon className="mr-1 h-3 w-3" />
              )}
              {trend}
            </div>
          )}
        </div>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
