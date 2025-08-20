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
  Clock,
  Heart,
  TrendingUp,
  Activity,
  Shield,
  Award
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-2 mb-6">
              <Heart className="h-12 w-12 text-blue-600 animate-pulse" />
              <h1 className="text-3xl font-bold text-gray-900">Analyzing Your Health Data</h1>
            </div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-700">Processing your assessment...</h2>
              <p className="text-gray-600">Our AI models are analyzing your health information to provide personalized insights.</p>
            </div>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Card className="shadow-xl border-0">
            <CardContent className="p-8">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analysis Failed</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push("/assessment")} className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to Assessment
              </Button>
            </CardContent>
          </Card>
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
  const moderateRiskConditions = conditions.filter(([_, result]) => 
    result.category === "moderate"
  )
  const lowRiskConditions = conditions.filter(([_, result]) => 
    result.category === "low"
  )

  const averageRiskScore = conditions.reduce((sum, [_, result]) => sum + result.score, 0) / conditions.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Heart className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Your Health Risk Assessment</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Based on your comprehensive health data, here are your personalized risk assessments 
            and actionable recommendations for better health outcomes.
          </p>
          {demographics.age > 0 && (
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Assessment for {demographics.age} year old {demographics.sex}</span>
              <span>•</span>
              <span>Completed on {new Date().toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">{conditions.length}</div>
                <div className="text-blue-100">Conditions Analyzed</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">{Math.round(averageRiskScore * 100)}%</div>
                <div className="text-blue-100">Average Risk Score</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">{highRiskConditions.length}</div>
                <div className="text-blue-100">High Risk Conditions</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">{recommendations ? recommendations.immediate?.length || 0 : 0}</div>
                <div className="text-blue-100">Recommended Actions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Triage Banner */}
        {triageResult && (
          <TriageBanner triage={triageResult} />
        )}

        {/* Risk Level Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highRiskConditions.length > 0 && (
            <Card className="shadow-lg border-0 bg-red-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  High Risk ({highRiskConditions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {highRiskConditions.map(([condition, result]) => (
                    <div key={condition} className="flex justify-between items-center p-2 bg-red-100 rounded">
                      <span className="font-medium text-red-900">
                        {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <Badge variant="destructive">{Math.round(result.score * 100)}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {moderateRiskConditions.length > 0 && (
            <Card className="shadow-lg border-0 bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <Activity className="h-5 w-5" />
                  Moderate Risk ({moderateRiskConditions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {moderateRiskConditions.map(([condition, result]) => (
                    <div key={condition} className="flex justify-between items-center p-2 bg-yellow-100 rounded">
                      <span className="font-medium text-yellow-900">
                        {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <Badge variant="secondary" className="bg-yellow-200 text-yellow-800">
                        {Math.round(result.score * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {lowRiskConditions.length > 0 && (
            <Card className="shadow-lg border-0 bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Low Risk ({lowRiskConditions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowRiskConditions.map(([condition, result]) => (
                    <div key={condition} className="flex justify-between items-center p-2 bg-green-100 rounded">
                      <span className="font-medium text-green-900">
                        {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                      <Badge variant="outline" className="border-green-300 text-green-700">
                        {Math.round(result.score * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Detailed Risk Cards */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Detailed Risk Analysis</h2>
            <p className="text-gray-600">Click on any condition to view detailed explanations and contributing factors.</p>
          </div>
          
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
        </div>

        {/* High Risk Alert */}
        {highRiskConditions.length > 0 && (
          <Card className="shadow-xl border-0 bg-gradient-to-r from-red-50 to-pink-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-6 w-6" />
                High Risk Conditions Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-red-700 leading-relaxed">
                {highRiskConditions.length} condition{highRiskConditions.length > 1 ? 's' : ''} 
                {highRiskConditions.length === 1 ? ' has' : ' have'} been identified as high risk. 
                We strongly recommend consulting with a healthcare provider for further evaluation and guidance.
              </p>
              <div className="flex flex-wrap gap-2">
                {highRiskConditions.map(([condition, result]) => (
                  <Badge key={condition} variant="destructive" className="text-sm">
                    {condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: 
                    {Math.round(result.score * 100)}%
                  </Badge>
                ))}
              </div>
              <Button 
                onClick={() => router.push("/providers")}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Find Healthcare Providers Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        {recommendations && (
          <Card className="shadow-xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6" />
                Your Personalized Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2 text-green-700">
                    <Calendar className="h-5 w-5" />
                    Immediate Actions
                  </h4>
                  <div className="space-y-3">
                    {recommendations.immediate?.map((action: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="font-medium text-green-900">{action.title}</div>
                          <div className="text-sm text-green-700">{action.description}</div>
                          <div className="text-xs text-green-600 mt-1">Timeline: {action.timeframe}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2 text-blue-700">
                    <Clock className="h-5 w-5" />
                    Follow-up Timeline
                  </h4>
                  <div className="space-y-3">
                    {recommendations.followUp?.map((item: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="font-medium text-blue-900">{item.title}</div>
                          <div className="text-sm text-blue-700">{item.description}</div>
                          <div className="text-xs text-blue-600 mt-1">Due: {item.timeframe}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {recommendations.lifestyle && recommendations.lifestyle.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h4 className="font-semibold text-lg flex items-center gap-2 text-purple-700">
                    <TrendingUp className="h-5 w-5" />
                    Lifestyle Recommendations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.lifestyle.map((rec: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <div className="font-medium text-purple-900">{rec.title}</div>
                          <div className="text-sm text-purple-700">{rec.description}</div>
                        </div>
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

        {/* Action Buttons */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-gray-50 to-blue-50">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">What Would You Like to Do Next?</h3>
              <p className="text-gray-600">Choose from the options below to take action on your health assessment results.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => router.push("/providers")}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3"
              >
                <MapPin className="h-5 w-5" />
                Find Healthcare Providers
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => router.push("/share")}
                className="flex items-center gap-2 px-6 py-3 border-2"
              >
                <Share2 className="h-5 w-5" />
                Share Results
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Implement PDF export
                  console.log("Export PDF")
                }}
                className="flex items-center gap-2 px-6 py-3 border-2"
              >
                <Download className="h-5 w-5" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.push("/assessment")}
            className="flex items-center gap-2 px-6 py-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assessment
          </Button>
          
          <Button 
            onClick={() => router.push("/providers")}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-6 py-3"
          >
            Find Care
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 