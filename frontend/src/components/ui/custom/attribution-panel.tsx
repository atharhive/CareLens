import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Info } from "lucide-react"
import { cn } from "@/src/lib/utils"
import type { ContributingFactor } from "@/src/types"

interface AttributionPanelProps {
  factors: ContributingFactor[]
  className?: string
}

export function AttributionPanel({ factors, className }: AttributionPanelProps) {
  // Sort factors by absolute impact
  const sortedFactors = [...factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Feature Importance Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This analysis shows how each factor contributes to your risk assessment. Positive values increase risk, while
          negative values decrease it.
        </p>

        <div className="space-y-3">
          {sortedFactors.map((factor, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {factor.direction === "positive" ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">{factor.feature}</span>
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    factor.direction === "positive" ? "text-red-600" : "text-green-600",
                  )}
                >
                  {factor.direction === "positive" ? "+" : ""}
                  {factor.impact.toFixed(3)}
                </span>
              </div>

              <div className="space-y-1">
                <Progress
                  value={Math.abs(factor.impact) * 100}
                  className={cn("h-2", factor.direction === "positive" ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500")}
                />
                <p className="text-xs text-muted-foreground">{factor.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
