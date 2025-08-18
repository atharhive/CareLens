import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Shield, 
  Brain, 
  Users, 
  CheckCircle, 
  ArrowRight,
  FileText,
  Heart,
  AlertTriangle
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Risk Assessment",
      description: "Condition-specific machine learning models trained on medical data for accurate risk predictions.",
      color: "text-medical-blue"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "No data storage. All processing is temporary and automatically deleted within 30 minutes.",
      color: "text-medical-green"
    },
    {
      icon: Activity,
      title: "Transparent Explanations",
      description: "SHAP technology shows exactly which factors contribute to your risk scores.",
      color: "text-healthcare-teal"
    },
    {
      icon: Users,
      title: "Care Navigation",
      description: "Direct connection to appropriate healthcare providers based on your risk assessment.",
      color: "text-alert-orange"
    }
  ];

  const conditions = [
    "Diabetes Type 2",
    "Heart Disease", 
    "Stroke Risk",
    "Kidney Disease",
    "Liver Disease",
    "Anemia",
    "Thyroid Disorders"
  ];

  const useCases = [
    {
      icon: CheckCircle,
      title: "Preventive Health Screening",
      description: "Adults interested in early detection and risk factor assessment"
    },
    {
      icon: Heart,
      title: "Pre-Doctor Visit Preparation",
      description: "Gather comprehensive health insights before your appointment"
    },
    {
      icon: FileText,
      title: "Health Data Organization",
      description: "Upload and analyze lab reports with AI-powered extraction"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Advanced Health Risk
              <span className="text-medical-blue"> Assessment</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-powered health risk assessment using specialized machine learning models. 
              Get personalized insights, transparent explanations, and direct connections to healthcare providers.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/assessment">
                <Button size="lg" className="medical-button medical-button-primary text-lg px-8 py-3">
                  <Activity className="mr-2 h-5 w-5" />
                  Start Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                <FileText className="mr-2 h-5 w-5" />
                Learn How It Works
              </Button>
            </div>

            {/* Medical Disclaimer */}
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-w-4xl mx-auto">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Medical Disclaimer:</strong> CareLens provides risk estimates for educational purposes only. 
                  It is NOT a medical diagnosis or substitute for professional medical advice. 
                  Always consult healthcare providers for medical decisions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Why CareLens is More Accurate
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Unlike generic AI chatbots, we use condition-specific models for precise health assessment
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="medical-card hover:shadow-md transition-shadow">
                  <CardHeader className="text-center">
                    <Icon className={`h-12 w-12 mx-auto mb-4 ${feature.color}`} />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Conditions Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Conditions We Assess
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Specialized AI models for accurate risk assessment across multiple health conditions
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {conditions.map((condition, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-sm px-4 py-2 bg-medical-blue/10 text-medical-blue border-medical-blue/20"
              >
                {condition}
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Who Should Use CareLens?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="h-16 w-16 mx-auto mb-4 text-medical-blue" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {useCase.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-medical-blue to-healthcare-teal">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Understand Your Health Risks?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Start your AI-powered health assessment in just a few minutes
          </p>
          <Link href="/assessment">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              <Activity className="mr-2 h-5 w-5" />
              Begin Health Assessment
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
