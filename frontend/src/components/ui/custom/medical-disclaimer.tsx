import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/src/lib/utils"

interface MedicalDisclaimerProps {
  variant?: "compact" | "full"
  className?: string
}

export function MedicalDisclaimer({ variant = "compact", className }: MedicalDisclaimerProps) {
  if (variant === "compact") {
    return (
      <div className={cn("text-xs text-muted-foreground text-center p-2 bg-muted/50 rounded-md", className)}>
        <p>
          <strong>Medical Disclaimer:</strong> This tool is for informational purposes only and does not replace
          professional medical advice. Always consult with a healthcare provider for medical decisions.
        </p>
      </div>
    )
  }

  return (
    <Alert className={cn("border-amber-200 bg-amber-50", className)}>
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="space-y-2">
          <p className="font-semibold">Important Medical Disclaimer</p>
          <div className="text-sm space-y-1">
            <p>
              • This health risk assessment tool is designed for informational and educational purposes only and should
              not be used as a substitute for professional medical advice, diagnosis, or treatment.
            </p>
            <p>
              • The AI models used in this assessment are based on statistical patterns and may not account for all
              individual health factors or rare conditions.
            </p>
            <p>
              • Always seek the advice of your physician or other qualified health provider with any questions you may
              have regarding a medical condition.
            </p>
            <p>
              • Never disregard professional medical advice or delay in seeking it because of something you have read or
              learned from this assessment.
            </p>
            <p>• If you think you may have a medical emergency, call your doctor or emergency services immediately.</p>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
