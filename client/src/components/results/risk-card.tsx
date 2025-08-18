import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Brain
} from "lucide-react";
import { useState } from "react";
import type { RiskScore } from "@/types/assessment";

interface RiskCardProps {
  riskScore: RiskScore;
}

export default function RiskCard({ riskScore }: RiskCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'risk-card-very-high';
      case 'high': return 'risk-card-high';
      case 'moderate': return 'risk-card-moderate';
      default: return 'risk-card-low';
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800';
      default: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'very_high': return 'Very High Risk';
      case 'high': return 'High Risk';
      case 'moderate': return 'Moderate Risk';
      default: return 'Low Risk';
    }
  };

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'very_high': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const confidenceRange = `${riskScore.confidence[0]}% - ${riskScore.confidence[1]}%`;

  return (
    <Card className={`medical-card ${getRiskColor(riskScore.risk_level)}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            <Brain className="inline mr-2 h-5 w-5 text-medical-blue" />
            {riskScore.condition.toUpperCase()}
          </CardTitle>
          <Badge className={getRiskBadgeColor(riskScore.risk_level)}>
            {getRiskLabel(riskScore.risk_level)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Score Display */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {Math.round(riskScore.score)}%
          </div>
          <div className="relative">
            <Progress 
              value={riskScore.score} 
              className="h-3 mb-2"
            />
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(riskScore.risk_level)}`}
              style={{ width: `${riskScore.score}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            95% Confidence Interval: {confidenceRange}
          </p>
        </div>

        {/* Key Factors */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Key Risk Factors
          </h4>
          <div className="space-y-2">
            {riskScore.key_factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <div className="flex items-center mr-3">
                    {factor.direction === 'increases' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {factor.factor}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {factor.value}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    factor.direction === 'increases' 
                      ? 'text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' 
                      : 'text-green-600 border-green-200 dark:text-green-400 dark:border-green-800'
                  }`}
                >
                  {factor.contribution > 0 ? '+' : ''}{(factor.contribution * 100).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Show/Hide Details Button */}
        {riskScore.key_factors.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full"
          >
            {showDetails ? (
              <>
                <ChevronUp className="mr-2 h-4 w-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="mr-2 h-4 w-4" />
                Show All Factors ({riskScore.key_factors.length})
              </>
            )}
          </Button>
        )}

        {/* Detailed Factors */}
        {showDetails && (
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            {riskScore.key_factors.slice(3).map((factor, index) => (
              <div key={index + 3} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center">
                  <div className="flex items-center mr-3">
                    {factor.direction === 'increases' ? (
                      <TrendingUp className="h-4 w-4 text-red-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {factor.factor}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {factor.value}
                    </span>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    factor.direction === 'increases' 
                      ? 'text-red-600 border-red-200 dark:text-red-400 dark:border-red-800' 
                      : 'text-green-600 border-green-200 dark:text-green-400 dark:border-green-800'
                  }`}
                >
                  {factor.contribution > 0 ? '+' : ''}{(factor.contribution * 100).toFixed(1)}%
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Risk Interpretation */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>What this means:</strong> Your {riskScore.score}% risk score indicates that 
            {riskScore.score < 25 
              ? ' you have a lower than average risk for this condition. Continue healthy lifestyle habits.'
              : riskScore.score < 50
              ? ' you have some risk factors but they are manageable with lifestyle modifications.'
              : riskScore.score < 75
              ? ' you have multiple risk factors and should consider medical evaluation within weeks.'
              : ' you have strong indicators suggesting the condition may be present. Seek medical attention promptly.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
