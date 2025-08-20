import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Shield, Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface MedicalDisclaimerProps {
  variant?: "compact" | "full"
  className?: string
}

export function MedicalDisclaimer({ variant = "compact", className }: MedicalDisclaimerProps) {
  if (variant === "compact") {
    return (
      <div className={cn("text-xs text-gray-600 text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200", className)}>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-800">Medical Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          This tool is for informational purposes only and does not replace professional medical advice. 
          Always consult with a healthcare provider for medical decisions. Your health and safety are our priority.
        </p>
      </div>
    )
  }

  return (
    <Alert className={cn("border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50", className)}>
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-amber-600" />
            <p className="font-semibold text-lg">Important Medical Disclaimer</p>
          </div>
          <div className="text-sm space-y-2 leading-relaxed">
            <p>
              <strong>Educational Purpose Only:</strong> This health risk assessment tool is designed for informational 
              and educational purposes only and should not be used as a substitute for professional medical advice, 
              diagnosis, or treatment.
            </p>
            <p>
              <strong>AI Limitations:</strong> The AI models used in this assessment are based on statistical patterns 
              and may not account for all individual health factors or rare conditions. Results should be interpreted 
              with caution.
            </p>
            <p>
              <strong>Professional Consultation:</strong> Always seek the advice of your physician or other qualified 
              health provider with any questions you may have regarding a medical condition or the results of this assessment.
            </p>
            <p>
              <strong>No Delay in Care:</strong> Never disregard professional medical advice or delay in seeking it 
              because of something you have read or learned from this assessment.
            </p>
            <p>
              <strong>Emergency Situations:</strong> If you think you may have a medical emergency, call your doctor 
              or emergency services immediately. This tool is not designed for emergency medical situations.
            </p>
            <div className="mt-4 p-3 bg-amber-100 rounded-md border border-amber-200">
              <p className="font-medium text-amber-900">
                💡 <strong>Remember:</strong> This assessment is a starting point for understanding your health risks. 
                Always discuss the results with your healthcare provider for personalized medical guidance.
              </p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
