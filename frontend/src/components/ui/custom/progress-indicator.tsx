import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-6">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-semibold transition-all duration-300 relative",
                  index < currentStep
                    ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                    : index === currentStep
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg ring-4 ring-blue-200"
                      : "bg-white border-gray-300 text-gray-500 hover:border-gray-400",
                )}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-xs font-medium transition-colors",
                  index <= currentStep ? "text-blue-600" : "text-gray-500"
                )}>
                  {step}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div
                  className={cn(
                    "h-1 rounded-full transition-all duration-500",
                    index < currentStep ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div 
          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          {steps[currentStep]}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Step {currentStep + 1} of {steps.length} • {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
        </p>
      </div>
    </div>
  )
}
