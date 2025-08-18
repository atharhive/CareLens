import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { assessmentApi } from "@/lib/api";
import RiskCard from "@/components/results/risk-card";
import { 
  Activity, 
  Download, 
  Share, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Users,
  FileText,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

export default function Results() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['/api/assessment/results', sessionId],
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 text-medical-blue mx-auto mb-4 animate-pulse" />
              <h2 className="text-lg font-semibold mb-2">Analyzing Your Health Data</h2>
              <p className="text-sm text-gray-600">
                Our AI models are processing your information...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Analysis Failed</h2>
              <p className="text-sm text-gray-600 mb-4">
                Unable to retrieve your assessment results.
              </p>
              <Link href="/assessment">
                <Button>Start New Assessment</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800';
      case 'prompt': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-300 dark:border-yellow-800';
      default: return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return AlertTriangle;
      case 'prompt': return Clock;
      default: return Activity;
    }
  };

  const highRiskConditions = results.risk_scores.filter(score => 
    score.risk_level === 'high' || score.risk_level === 'very_high'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Your Health Risk Assessment
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              AI-powered analysis completed on {new Date(results.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline" size="sm">
              <Share className="mr-2 h-4 w-4" />
              Share Results
            </Button>
          </div>
        </div>

        {/* Urgency Alert */}
        <Alert className={`mt-6 ${getUrgencyColor(results.urgency_level)}`}>
          <div className="flex items-center">
            {(() => {
              const UrgencyIcon = getUrgencyIcon(results.urgency_level);
              return <UrgencyIcon className="h-4 w-4" />;
            })()}
            <AlertDescription className="ml-2">
              <strong className="capitalize">{results.urgency_level} Priority:</strong>{' '}
              {results.urgency_level === 'urgent' 
                ? 'Contact healthcare provider within 24-72 hours'
                : results.urgency_level === 'prompt'
                ? 'Schedule appointment within 2-4 weeks'
                : 'Continue routine care and healthy lifestyle'
              }
            </AlertDescription>
          </div>
        </Alert>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Scores */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Risk Assessment Results
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {results.risk_scores.map((riskScore, index) => (
                <RiskCard key={index} riskScore={riskScore} />
              ))}
            </div>
          </div>

          {/* Next Steps */}
          {results.next_steps.length > 0 && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-medical-blue" />
                  Recommended Next Steps
                </CardTitle>
                <CardDescription>
                  Personalized action plan based on your risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.next_steps.map((step, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-medical-blue text-white rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg">Assessment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Conditions Assessed</span>
                  <Badge variant="secondary">{results.risk_scores.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">High Risk Conditions</span>
                  <Badge 
                    variant={highRiskConditions.length > 0 ? "destructive" : "secondary"}
                  >
                    {highRiskConditions.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Priority Level</span>
                  <Badge 
                    variant="secondary" 
                    className={`capitalize ${getUrgencyColor(results.urgency_level)}`}
                  >
                    {results.urgency_level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Recommendations */}
          {results.specialist_recommendations.length > 0 && (
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-healthcare-teal" />
                  Specialist Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.specialist_recommendations.map((specialist, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {specialist}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
                <Link href="/providers">
                  <Button className="w-full mt-4" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Find Providers
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Medical Disclaimer */}
          <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Medical Disclaimer:</strong> These results are for educational purposes only and do not constitute medical advice. Always consult healthcare professionals for medical decisions.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/assessment">
              <Button className="w-full medical-button medical-button-primary">
                <Activity className="mr-2 h-4 w-4" />
                Start New Assessment
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              View User Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
