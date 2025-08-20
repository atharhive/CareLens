import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock, Phone, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TriageResult } from "@/types"

interface TriageBannerProps {
  triage: TriageResult
  className?: string
}

export function TriageBanner({ triage, className }: TriageBannerProps) {
  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case "red":
        return {
          icon: AlertTriangle,
          title: "Urgent Medical Attention Required",
          bgColor: "bg-red-50 border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
        }
      case "amber":
        return {
          icon: Clock,
          title: "Medical Consultation Recommended",
          bgColor: "bg-amber-50 border-amber-200",
          iconColor: "text-amber-600",
          titleColor: "text-amber-800",
        }
      case "green":
        return {
          icon: CheckCircle,
          title: "Continue Regular Health Monitoring",
          bgColor: "bg-green-50 border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
        }
      default:
        return {
          icon: AlertTriangle,
          title: "Assessment Complete",
          bgColor: "bg-gray-50 border-gray-200",
          iconColor: "text-gray-600",
          titleColor: "text-gray-800",
        }
    }
  }

  const config = getUrgencyConfig(triage.urgency)
  const Icon = config.icon

  return (
    <Alert className={cn(config.bgColor, "border-2", className)}>
      <Icon className={cn("h-5 w-5", config.iconColor)} />
      <AlertTitle className={cn("text-lg font-semibold", config.titleColor)}>{config.title}</AlertTitle>
      <AlertDescription className="space-y-4">
        <div className="space-y-2">
          <p className="font-medium">Recommended timeframe: {triage.timeframe}</p>

          {triage.actions.length > 0 && (
            <div>
              <p className="font-medium mb-2">Immediate actions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {triage.actions.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {triage.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="font-medium text-yellow-800 mb-2">Important warnings:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                {triage.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {triage.urgency === "red" && (
          <div className="flex gap-2">
            <Button variant="destructive" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Call Emergency Services
            </Button>
            <Button variant="outline" size="sm">
              Find Nearest Hospital
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
