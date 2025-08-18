"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIntakeStore } from "@/src/stores/intake-store"
import { useUnitConversion } from "@/src/hooks/use-unit-conversion"
import { RotateCcw, Info } from "lucide-react"

export function VitalsForm() {
  const { vitals, setVitals, errors } = useIntakeStore()
  const { convertTemperatureValue } = useUnitConversion()

  const handleInputChange = (field: keyof typeof vitals, value: string | number) => {
    setVitals({ [field]: value })
  }

  const handleTemperatureUnitToggle = () => {
    const currentUnit = vitals.temperatureUnit
    const newUnit = currentUnit === "celsius" ? "fahrenheit" : "celsius"

    if (vitals.temperature && vitals.temperature > 0) {
      const convertedTemp = convertTemperatureValue(vitals.temperature, currentUnit, newUnit)
      setVitals({
        temperatureUnit: newUnit,
        temperature: convertedTemp,
      })
    } else {
      setVitals({ temperatureUnit: newUnit })
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Optional but Recommended</p>
            <p>
              Vital signs help improve the accuracy of your risk assessment. If you don't have recent measurements, you
              can skip this step or take measurements now.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Blood Pressure */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Blood Pressure</CardTitle>
            <CardDescription>Enter your most recent blood pressure reading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systolic">Systolic (top number)</Label>
                <div className="flex gap-2">
                  <Input
                    id="systolic"
                    type="number"
                    min="70"
                    max="250"
                    value={vitals.systolicBP || ""}
                    onChange={(e) => handleInputChange("systolicBP", Number.parseInt(e.target.value) || undefined)}
                    placeholder="120"
                    className={errors.bloodPressure ? "border-destructive" : ""}
                  />
                  <Badge variant="outline" className="px-3 py-2">
                    mmHg
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Diastolic (bottom number)</Label>
                <div className="flex gap-2">
                  <Input
                    id="diastolic"
                    type="number"
                    min="40"
                    max="150"
                    value={vitals.diastolicBP || ""}
                    onChange={(e) => handleInputChange("diastolicBP", Number.parseInt(e.target.value) || undefined)}
                    placeholder="80"
                    className={errors.bloodPressure ? "border-destructive" : ""}
                  />
                  <Badge variant="outline" className="px-3 py-2">
                    mmHg
                  </Badge>
                </div>
              </div>
            </div>
            {errors.bloodPressure && <p className="text-sm text-destructive">{errors.bloodPressure}</p>}
            <div className="text-xs text-muted-foreground">
              Normal: Less than 120/80 mmHg • High: 140/90 mmHg or higher
            </div>
          </CardContent>
        </Card>

        {/* Heart Rate */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Heart Rate</CardTitle>
            <CardDescription>Your resting heart rate in beats per minute</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heartRate">Beats per minute</Label>
              <div className="flex gap-2">
                <Input
                  id="heartRate"
                  type="number"
                  min="30"
                  max="220"
                  value={vitals.heartRate || ""}
                  onChange={(e) => handleInputChange("heartRate", Number.parseInt(e.target.value) || undefined)}
                  placeholder="72"
                  className={errors.heartRate ? "border-destructive" : ""}
                />
                <Badge variant="outline" className="px-3 py-2">
                  bpm
                </Badge>
              </div>
              {errors.heartRate && <p className="text-sm text-destructive">{errors.heartRate}</p>}
              <div className="text-xs text-muted-foreground">Normal resting: 60-100 bpm • Athletic: 40-60 bpm</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Body Temperature</CardTitle>
          <CardDescription>Your current body temperature (if feeling unwell)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <Button variant="ghost" size="sm" onClick={handleTemperatureUnitToggle} className="h-6 px-2 text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                {vitals.temperatureUnit === "celsius" ? "Switch to °F" : "Switch to °C"}
              </Button>
            </div>
            <div className="flex gap-2 max-w-xs">
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={vitals.temperature || ""}
                onChange={(e) => handleInputChange("temperature", Number.parseFloat(e.target.value) || undefined)}
                placeholder={vitals.temperatureUnit === "celsius" ? "37.0" : "98.6"}
                className={errors.temperature ? "border-destructive" : ""}
              />
              <Badge variant="outline" className="px-3 py-2">
                °{vitals.temperatureUnit === "celsius" ? "C" : "F"}
              </Badge>
            </div>
            {errors.temperature && <p className="text-sm text-destructive">{errors.temperature}</p>}
            <div className="text-xs text-muted-foreground">
              Normal: {vitals.temperatureUnit === "celsius" ? "36.1-37.2°C" : "97.0-99.0°F"} • Fever:{" "}
              {vitals.temperatureUnit === "celsius" ? "38.0°C+" : "100.4°F+"}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
        <p className="font-medium mb-2">Tips for accurate measurements:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Take blood pressure after sitting quietly for 5 minutes</li>
          <li>Measure heart rate when at rest, not after physical activity</li>
          <li>Use a reliable thermometer for temperature readings</li>
          <li>If you don't have recent measurements, you can skip this step</li>
        </ul>
      </div>
    </div>
  )
}
