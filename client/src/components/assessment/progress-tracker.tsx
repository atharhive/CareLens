import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Clock } from "lucide-react";
import type { AssessmentStep } from "@/types/assessment";

interface ProgressTrackerProps {
  currentStep: AssessmentStep;
  completedSteps: AssessmentStep[];
}

const steps: Array<{ key: AssessmentStep; label: string; description: string }> = [
  { key: 'demographics', label: 'Demographics', description: 'Basic information' },
  { key: 'vitals', label: 'Vital Signs', description: 'Blood pressure & heart rate' },
  { key: 'history', label: 'Medical History', description: 'Conditions & medications' },
  { key: 'symptoms', label: 'Symptoms', description: 'Current symptoms' },
  { key: 'labs', label: 'Lab Results', description: 'Upload lab reports' },
  { key: 'review', label: 'Review', description: 'Confirm and analyze' }
];

export default function ProgressTracker({ currentStep, completedSteps }: ProgressTrackerProps) {
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  const completedCount = completedSteps.length;
  const totalSteps = steps.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <Card className="medical-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assessment Progress
          </h3>
          <Badge variant="secondary" className="bg-medical-green/10 text-medical-green border-medical-green/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            {completedCount}/{totalSteps} Complete
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-medical-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key);
            const isCurrent = step.key === currentStep;
            const isPending = !isCompleted && !isCurrent;

            return (
              <div 
                key={step.key}
                className={`flex items-center p-3 rounded-lg transition-colors ${
                  isCompleted 
                    ? 'bg-medical-green/10 border border-medical-green/20' 
                    : isCurrent 
                    ? 'bg-healthcare-teal/10 border border-healthcare-teal/20' 
                    : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="mr-3">
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-medical-green" />
                  ) : isCurrent ? (
                    <Clock className="h-5 w-5 text-healthcare-teal" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    isCompleted 
                      ? 'text-medical-green' 
                      : isCurrent 
                      ? 'text-healthcare-teal' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {step.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Quick Actions
          </h4>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm text-medical-blue hover:bg-medical-blue/5 rounded-lg flex items-center transition-colors">
              <Circle className="mr-2 h-4 w-4" />
              Skip Optional Steps
            </button>
            <button className="w-full text-left px-3 py-2 text-sm text-medical-blue hover:bg-medical-blue/5 rounded-lg flex items-center transition-colors">
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Progress
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
