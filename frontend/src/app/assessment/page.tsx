"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProgressIndicator } from "@/components/ui/custom/progress-indicator"
import { MedicalDisclaimer } from "@/components/ui/custom/medical-disclaimer"
import { useIntakeStore } from "@/stores/intake-store"
import { useFormPersistence } from "@/hooks/use-form-persistence"
import { ArrowLeft, ArrowRight } from "lucide-react"

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
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Restore Previous Assessment?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We found a previous assessment in progress. Would you like to continue where you left off or start a new
                assessment?
              </p>
              <div className="flex gap-4">
                <Button onClick={handleRestoreData} className="flex-1">
                  Continue Previous
                </Button>
                <Button variant="outline" onClick={handleStartFresh} className="flex-1 bg-transparent">
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
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold font-serif">Health Risk Assessment</h1>
          <p className="text-lg text-muted-foreground">
            Complete this comprehensive assessment to understand your health risks and get personalized recommendations.
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator steps={ASSESSMENT_STEPS} currentStep={currentStep} />

        {/* Main Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">{ASSESSMENT_STEPS[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderCurrentStep()}

            {/* Error Display */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
                <h4 className="font-medium text-destructive mb-2">Please correct the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-destructive">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center gap-2 bg-transparent"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>

              <Button onClick={handleNext} disabled={!isValid && currentStep !== 5} className="flex items-center gap-2">
                {isLastStep ? "Submit Assessment" : "Next"}
                {!isLastStep && <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Medical Disclaimer */}
        <MedicalDisclaimer variant="compact" />
      </div>
    </div>
  )
}
