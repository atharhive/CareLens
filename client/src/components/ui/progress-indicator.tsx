import { cn } from "@/lib/utils"

interface ProgressIndicatorProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors",
                index < currentStep
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-muted-foreground",
              )}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn("h-0.5 w-12 mx-2 transition-colors", index < currentStep ? "bg-primary" : "bg-border")}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{steps[currentStep]}</p>
        <p className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  )
}
