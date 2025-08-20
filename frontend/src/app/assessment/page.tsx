"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "@/components/ui/custom/progress-indicator"
import { MedicalDisclaimer } from "@/components/ui/custom/medical-disclaimer"
import { useIntakeStore } from "@/stores/intake-store"
import { useFormPersistence } from "@/hooks/use-form-persistence"
import { ArrowLeft, ArrowRight, Heart, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import form step components
import { DemographicsForm } from "@/components/forms/demographics-form"
import { VitalsForm } from "@/components/forms/vitals-form"
import { SymptomsForm } from "@/components/forms/symptoms-form"
import { MedicalHistoryForm } from "@/components/forms/medical-history-form"
import { DocumentUploadForm } from "@/components/forms/document-upload-form"
import { ReviewForm } from "@/components/forms/review-form"

const ASSESSMENT_STEPS = [
  "Demographics",
  "Vital Signs",
  "Symptoms",
  "Medical History",
  "Lab Reports",
  "Review & Submit",
]

export default function AssessmentPage() {
  const { currentStep, isValid, errors, nextStep, previousStep, setCurrentStep, validateCurrentStep, resetForm } =
    useIntakeStore()

  const { restoreFormData, clearSavedData } = useFormPersistence()
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)

  useEffect(() => {
    const savedData = restoreFormData()
    if (savedData && savedData.currentStep > 0) {
      setShowRestorePrompt(true)
    }
  }, [])

  const handleRestoreData = () => {
    const savedData = restoreFormData()
    if (savedData) {
      // Restore would be handled by Zustand persist middleware
      setCurrentStep(savedData.currentStep)
    }
    setShowRestorePrompt(false)
  }

  const handleStartFresh = () => {
    resetForm()
    clearSavedData()
    setShowRestorePrompt(false)
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      nextStep()
    }
  }

  const handlePrevious = () => {
    previousStep()
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <DemographicsForm />
      case 1:
        return <VitalsForm />
      case 2:
        return <SymptomsForm />
      case 3:
        return <MedicalHistoryForm />
      case 4:
        return <DocumentUploadForm />
      case 5:
        return <ReviewForm />
      default:
        return <DemographicsForm />
    }
  }

  const isLastStep = currentStep === ASSESSMENT_STEPS.length - 1
  const isFirstStep = currentStep === 0

  if (showRestorePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Heart className="h-8 w-8 text-blue-600" />
                <CardTitle className="text-2xl">Welcome Back to CareLens</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  We found a previous assessment in progress. Would you like to continue where you left off or start a new assessment?
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleRestoreData} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Continue Previous
                </Button>
                <Button variant="outline" onClick={handleStartFresh} className="flex-1">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Start Fresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Health Risk Assessment</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Complete this comprehensive assessment to understand your health risks and get personalized recommendations. 
            Your data is secure and protected by HIPAA compliance standards.
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <ProgressIndicator steps={ASSESSMENT_STEPS} currentStep={currentStep} />
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-xl flex items-center space-x-2">
              <span>Step {currentStep + 1} of {ASSESSMENT_STEPS.length}</span>
              <span className="text-blue-200">•</span>
              <span>{ASSESSMENT_STEPS[currentStep]}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {renderCurrentStep()}

            {/* Error Display */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive" className="mt-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Please correct the following errors:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2 px-6 py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button 
                onClick={handleNext} 
                disabled={!isValid && currentStep !== 5} 
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLastStep ? (
                  <>
                    Submit Assessment
                    <CheckCircle className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medical Disclaimer */}
        <Card className="shadow-lg border-0 bg-gray-50">
          <CardContent className="p-6">
            <MedicalDisclaimer variant="compact" />
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="shadow-lg border-0 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                <p className="text-sm text-blue-800 mb-3">
                  If you have any questions about this assessment or need assistance, our support team is here to help.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                    View FAQ
                  </Button>
                  <Button variant="outline" size="sm" className="text-blue-700 border-blue-300">
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
