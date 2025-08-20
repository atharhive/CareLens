"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Info, TrendingUp, TrendingDown } from "lucide-react"
import { cn } from "@/src/lib/utils"
import type { RiskScore } from "@/src/types"

interface RiskCardProps {
  condition: string
  riskScore: RiskScore
  onViewExplanation?: () => void
  onViewModelDetails?: () => void
  className?: string
}

export function RiskCard({ condition, riskScore, onViewExplanation, onViewModelDetails, className }: RiskCardProps) {
  const getRiskColor = (category: string) => {
    switch (category) {
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      case "moderate":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRiskIcon = (category: string) => {
    switch (category) {
      case "critical":
      case "high":
        return <AlertTriangle className="h-4 w-4" />
      case "moderate":
        return <TrendingUp className="h-4 w-4" />
      case "low":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const topFactors = riskScore.contributingFactors.slice(0, 3)

  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{condition}</CardTitle>
          <Badge className={cn("border", getRiskColor(riskScore.category))}>
            {getRiskIcon(riskScore.category)}
            <span className="ml-1 capitalize">{riskScore.category} Risk</span>
          </Badge>
        </div>
        <CardDescription>Risk assessment based on your health data</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Score Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-foreground">{Math.round(riskScore.score * 100)}%</div>
          <Progress value={riskScore.score * 100} className="h-2" />
          <p className="text-sm text-muted-foreground">Confidence: {Math.round(riskScore.confidence * 100)}%</p>
        </div>

        {/* Top Contributing Factors */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Top Contributing Factors:</h4>
          <div className="space-y-1">
            {topFactors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{factor.feature}</span>
                <div className="flex items-center gap-1">
                  {factor.direction === "positive" ? (
                    <TrendingUp className="h-3 w-3 text-red-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-green-500" />
                  )}
                  <span className="font-medium">{Math.abs(factor.impact).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onViewExplanation} className="flex-1 bg-transparent">
            View Explanation
          </Button>
          <Button variant="outline" size="sm" onClick={onViewModelDetails} className="flex-1 bg-transparent">
            Model Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
