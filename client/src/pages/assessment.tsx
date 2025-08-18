import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { assessmentApi } from "@/lib/api";
import { useAssessmentStore } from "@/store/assessment";
import ProgressTracker from "@/components/assessment/progress-tracker";
import RiskForm from "@/components/assessment/risk-form";
import FileUpload from "@/components/assessment/file-upload";
import { ArrowLeft, ArrowRight, Activity } from "lucide-react";

export default function Assessment() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const {
    sessionId,
    currentStep,
    completedSteps,
    setSessionId,
    setCurrentStep,
    markStepCompleted,
    getProgress,
    demographicData,
    vitalSigns,
    medicalHistory,
    symptoms,
    labResults
  } = useAssessmentStore();

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: assessmentApi.createSession,
    onSuccess: (data) => {
      setSessionId(data.session_id);
      toast({
        title: "Assessment started",
        description: "Your session has been created. Data will be automatically deleted in 30 minutes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to start assessment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit form data mutation
  const submitDataMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!sessionId) throw new Error('No session ID');
      return assessmentApi.submitFormData(sessionId, data);
    },
    onSuccess: () => {
      markStepCompleted(currentStep);
    },
    onError: (error) => {
      toast({
        title: "Failed to save data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Run analysis mutation
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No session ID');
      return assessmentApi.analyzeRisks(sessionId);
    },
    onSuccess: (data) => {
      navigate(`/results/${data.session_id}`);
    },
    onError: (error) => {
      toast({
        title: "Analysis failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize session on component mount
  useEffect(() => {
    if (!sessionId) {
      createSessionMutation.mutate();
    }
  }, []);

  const steps = ['demographics', 'vitals', 'history', 'symptoms', 'labs', 'review'] as const;
  const currentStepIndex = steps.indexOf(currentStep);

  const handleNext = async () => {
    // Save current step data
    const stepData = {
      ...(currentStep === 'demographics' && { demographicData }),
      ...(currentStep === 'vitals' && { vitalSigns }),
      ...(currentStep === 'history' && { medicalHistory }),
      ...(currentStep === 'symptoms' && { symptoms }),
      ...(currentStep === 'labs' && { labResults }),
    };

    await submitDataMutation.mutateAsync(stepData);

    if (currentStep === 'review') {
      // Run analysis
      analyzeMutation.mutate();
    } else {
      // Move to next step
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < steps.length) {
        setCurrentStep(steps[nextStepIndex]);
      }
    }
  };

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'demographics':
        return demographicData.age && demographicData.sex;
      case 'vitals':
        return true; // Optional
      case 'history':
        return medicalHistory.smoking && medicalHistory.alcohol && medicalHistory.exercise;
      case 'symptoms':
        return true; // Optional
      case 'labs':
        return true; // Optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'demographics': return 'Basic Information';
      case 'vitals': return 'Vital Signs';
      case 'history': return 'Medical History';
      case 'symptoms': return 'Current Symptoms';
      case 'labs': return 'Lab Results';
      case 'review': return 'Review & Analyze';
      default: return 'Assessment';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'demographics': return 'Tell us about yourself to personalize the assessment';
      case 'vitals': return 'Recent vital signs help improve accuracy (optional)';
      case 'history': return 'Your medical background and lifestyle factors';
      case 'symptoms': return 'Any symptoms you\'re currently experiencing';
      case 'labs': return 'Upload lab reports for the most accurate analysis';
      case 'review': return 'Review your information and run the AI analysis';
      default: return '';
    }
  };

  if (createSessionMutation.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="h-8 w-8 text-medical-blue mx-auto mb-4 animate-pulse" />
              <h2 className="text-lg font-semibold mb-2">Starting Assessment</h2>
              <p className="text-sm text-gray-600">
                Setting up your secure session...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar with Progress */}
        <div className="w-80 flex-shrink-0">
          <ProgressTracker 
            currentStep={currentStep} 
            completedSteps={completedSteps} 
          />
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">
                {getStepTitle()}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300">
                {getStepDescription()}
              </p>
            </CardHeader>
            <CardContent>
              {/* Step Content */}
              {currentStep === 'labs' ? (
                <FileUpload />
              ) : (
                <RiskForm step={currentStep} />
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-4">
                  {currentStep !== 'review' && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const nextStepIndex = currentStepIndex + 1;
                        if (nextStepIndex < steps.length) {
                          setCurrentStep(steps[nextStepIndex]);
                        }
                      }}
                    >
                      Skip Step
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || submitDataMutation.isPending || analyzeMutation.isPending}
                    className="medical-button medical-button-primary"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Activity className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : currentStep === 'review' ? (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        Run Analysis
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
