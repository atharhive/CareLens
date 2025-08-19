"use client"

import { Card, CardContent } from "@/components/ui/card"

interface MedicalDisclaimerProps {
  variant?: "compact" | "full"
  className?: string
}

export function MedicalDisclaimer({ variant = "compact", className }: MedicalDisclaimerProps) {
  if (variant === "compact") {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-md p-3 ${className}`}>
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800">Medical Disclaimer</p>
            <p className="text-xs text-amber-700 mt-1">
              This tool provides informational risk assessments only and is not a substitute for professional medical
              advice, diagnosis, or treatment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className={`border-amber-200 bg-amber-50 ${className}`}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-amber-900">Important Medical Disclaimer</h3>

            <div className="space-y-2 text-sm text-amber-800">
              <p>
                <strong>This risk assessment tool is for informational purposes only</strong> and should not be used as
                a substitute for professional medical advice, diagnosis, or treatment.
              </p>

              <p>
                The results provided by this assessment are based on statistical models and population data. Individual
                health outcomes may vary significantly based on factors not captured in this assessment.
              </p>

              <p>
                <strong>Always seek the advice of your physician</strong> or other qualified health provider with any
                questions you may have regarding a medical condition. Never disregard professional medical advice or
                delay in seeking it because of something you have read in this assessment.
              </p>

              <p>
                <strong>In case of a medical emergency,</strong> call 911 or go to the nearest emergency room
                immediately.
              </p>
            </div>

            <div className="bg-amber-100 border border-amber-300 rounded-md p-3 mt-4">
              <p className="text-xs text-amber-700">
                <strong>Regulatory Notice:</strong> This tool has not been evaluated by the FDA and is not intended to
                diagnose, treat, cure, or prevent any disease. Results should be discussed with a healthcare
                professional.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
