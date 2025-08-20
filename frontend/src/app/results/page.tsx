"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RiskCard } from "@/components/ui/custom/risk-card"
import { TriageBanner } from "@/components/ui/custom/triage-banner"
import { AttributionPanel } from "@/components/ui/custom/attribution-panel"
import { useResultsStore } from "@/stores/results-store"
import { useIntakeStore } from "@/stores/intake-store"
import { 
  ArrowLeft, 
  Share2, 
  MapPin, 
  Calendar, 
  FileText, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react"

export default function ResultsPage() {
  const router = useRouter()
  const { detectionResults, triageResult, recommendations, isLoading, error } = useResultsStore()
  const { demographics } = useIntakeStore()
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)

  useEffect(() => {
    // If no results, redirect to assessment
    if (!detectionResults && !isLoading) {
      router.push("/assessment")
    }
  }, [detectionResults, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Analyzing your health data...</h2>
            <p className="text-muted-foreground">This may take a few moments</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-semibold">Analysis Failed</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/assessment")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Assessment
          </Button>
        </div>
      </div>
    )
  }

  if (!detectionResults) {
    return null
  }

  const conditions = Object.entries(detectionResults) as [string, any][]
  const highRiskConditions = conditions.filter(([_, result]) => 
    result.category === "high" || result.category === "critical"
  )

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Your Health Risk Assessment</h1>
          <p className="text-lg text-muted-foreground">
            Based on your health data, here are your personalized risk assessments
          </p>
          {demographics.age > 0 && (
            <p className="text-sm text-muted-foreground">
              Assessment for {demographics.age} year old {demographics.sex}
            </p>
          )}
        </div>

        {/* Triage Banner */}
        {triageResult && (
          <TriageBanner triage={triageResult} />
        )}

        {/* Risk Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {conditions.map(([condition, result]) => (
            <RiskCard
              key={condition}
              condition={condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              riskScore={result}
              onViewExplanation={() => setSelectedCondition(condition)}
              onViewModelDetails={() => {
                // TODO: Implement model details modal
                console.log("View model details for", condition)
              }}
            />
          ))}
        </div>

        {/* High Risk Alert */}
        {highRiskConditions.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                High Risk Conditions Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                {highRiskConditions.length} condition{highRiskConditions.length > 1 ? 's' : ''} 
                {highRiskConditions.length === 1 ? ' has' : ' have'} been identified as high risk. 
                Please consult with a healthcare provider.
              </p>
              <div className="flex flex-wrap gap-2">
                {highRiskConditions.map(([condition, result]) => (
                  <Badge key={condition} variant="destructive">
                    {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: 
                    {Math.round(result.score * 100)}%
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => router.push("/providers")}
            className="flex items-center gap-2"
          >
            <MapPin className="h-4 w-4" />
            Find Healthcare Providers
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => router.push("/share")}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              // TODO: Implement PDF export
              console.log("Export PDF")
            }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>

        {/* Next Steps */}
        {recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <h4 className="font-medium flex items-center gap-2">
                     <Calendar className="h-4 w-4" />
                     Immediate Actions
                   </h4>
                   <ul className="space-y-1 text-sm text-muted-foreground">
                     {recommendations.immediate?.map((action: any, index: number) => (
                       <li key={index} className="flex items-start gap-2">
                         <span className="text-green-600 mt-1">•</span>
                         {action.title}
                       </li>
                     ))}
                   </ul>
                 </div>
                 
                 <div className="space-y-2">
                   <h4 className="font-medium flex items-center gap-2">
                     <Clock className="h-4 w-4" />
                     Follow-up Timeline
                   </h4>
                   <ul className="space-y-1 text-sm text-muted-foreground">
                     {recommendations.followUp?.map((item: any, index: number) => (
                       <li key={index} className="flex items-start gap-2">
                         <span className="text-blue-600 mt-1">•</span>
                         {item.title} - {item.timeframe}
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
               
               {recommendations.lifestyle && recommendations.lifestyle.length > 0 && (
                 <div className="space-y-2">
                   <h4 className="font-medium">Lifestyle Recommendations</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     {recommendations.lifestyle.map((rec: any, index: number) => (
                       <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded">
                         <span className="text-primary mt-1">•</span>
                         <span className="text-sm">{rec.title}</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
        )}

                 {/* Attribution Panel */}
         {selectedCondition && detectionResults[selectedCondition as keyof typeof detectionResults] && (
           <AttributionPanel
             factors={detectionResults[selectedCondition as keyof typeof detectionResults].contributingFactors}
           />
         )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push("/assessment")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Button>
          
          <Button 
            onClick={() => router.push("/providers")}
            className="flex items-center gap-2"
          >
            Find Care
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 