"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useIntakeStore } from "@/stores/intake-store"
import { useUnitConversion } from "@/hooks/use-unit-conversion"
import { RotateCcw, Info, AlertCircle, CheckCircle } from "lucide-react"
import { validateBloodPressure, validateHeartRate, validateTemperature } from "@/utils/validation"

export function VitalsForm() {
  const { vitals, setVitals, errors, clearErrors } = useIntakeStore()
  const { convertTemperatureValue } = useUnitConversion()
  
  // Local state for real-time validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Real-time validation function
  const validateField = (field: string, value: any) => {
    let error = ""
    
    switch (field) {
      case "bloodPressure":
        if (vitals.systolicBP && vitals.diastolicBP) {
          error = validateBloodPressure(vitals.systolicBP, vitals.diastolicBP) || ""
        }
        break
      case "heartRate":
        if (value) {
          error = validateHeartRate(value) || ""
        }
        break
      case "temperature":
        if (value) {
          error = validateTemperature(value, vitals.temperatureUnit) || ""
        }
        break
      default:
        break
    }
    
    return error
  }

  // Handle input change with real-time validation
  const handleInputChange = (field: keyof typeof vitals, value: string | number | undefined) => {
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, field]))
    
    // Update the store
    setVitals({ [field]: value })
    
    // Validate the field immediately
    let error = ""
    if (field === "systolicBP" || field === "diastolicBP") {
      error = validateField("bloodPressure", value)
    } else {
      error = validateField(field, value)
    }
    
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }))
    
    // Clear the error from store if field is now valid
    if (!error && errors[field]) {
      clearErrors()
    }
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
      
      // Re-validate temperature with new unit
      const error = validateField("temperature", convertedTemp)
      setFieldErrors(prev => ({
        ...prev,
        temperature: error
      }))
    } else {
      setVitals({ temperatureUnit: newUnit })
    }
  }

  // Get error for a specific field
  const getFieldError = (field: string) => {
    if (touchedFields.has(field) && fieldErrors[field]) {
      return fieldErrors[field]
    }
    return errors[field] || ""
  }

  // Check if field is valid
  const isFieldValid = (field: string) => {
    return touchedFields.has(field) && !getFieldError(field)
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
                  <div className="relative flex-1">
                    <Input
                      id="systolic"
                      type="number"
                      min="70"
                      max="250"
                      value={vitals.systolicBP || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange("systolicBP", value === "" ? undefined : Number.parseInt(value) || undefined);
                      }}
                      placeholder="120"
                      className={`${getFieldError("systolicBP") ? "border-destructive pr-10" : isFieldValid("systolicBP") ? "border-green-500 pr-10" : ""}`}
                    />
                    {getFieldError("systolicBP") && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                    {isFieldValid("systolicBP") && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Badge variant="outline" className="px-3 py-2">
                    mmHg
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diastolic">Diastolic (bottom number)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="diastolic"
                      type="number"
                      min="40"
                      max="150"
                      value={vitals.diastolicBP || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleInputChange("diastolicBP", value === "" ? undefined : Number.parseInt(value) || undefined);
                      }}
                      placeholder="80"
                      className={`${getFieldError("diastolicBP") ? "border-destructive pr-10" : isFieldValid("diastolicBP") ? "border-green-500 pr-10" : ""}`}
                    />
                    {getFieldError("diastolicBP") && (
                      <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                    )}
                    {isFieldValid("diastolicBP") && (
                      <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <Badge variant="outline" className="px-3 py-2">
                    mmHg
                  </Badge>
                </div>
              </div>
            </div>
            {(getFieldError("systolicBP") || getFieldError("diastolicBP")) && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("systolicBP") || getFieldError("diastolicBP")}
              </p>
            )}
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
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="heartRate"
                  type="number"
                  min="30"
                  max="220"
                  value={vitals.heartRate || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange("heartRate", value === "" ? undefined : Number.parseInt(value) || undefined);
                  }}
                  placeholder="72"
                  className={`${getFieldError("heartRate") ? "border-destructive pr-10" : isFieldValid("heartRate") ? "border-green-500 pr-10" : ""}`}
                />
                {getFieldError("heartRate") && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                )}
                {isFieldValid("heartRate") && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                )}
              </div>
              <Badge variant="outline" className="px-3 py-2">
                bpm
              </Badge>
            </div>
            {getFieldError("heartRate") && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("heartRate")}
              </p>
            )}
            <div className="text-xs text-muted-foreground">Normal resting: 60-100 bpm • Athletic: 40-60 bpm</div>
          </CardContent>
        </Card>

        {/* Temperature */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Body Temperature</CardTitle>
            <CardDescription>Your body temperature</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 flex-1">
                <div className="relative flex-1">
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={vitals.temperature || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange("temperature", value === "" ? undefined : Number.parseFloat(value) || undefined);
                    }}
                    placeholder={vitals.temperatureUnit === "celsius" ? "37.0" : "98.6"}
                    className={`${getFieldError("temperature") ? "border-destructive pr-10" : isFieldValid("temperature") ? "border-green-500 pr-10" : ""}`}
                  />
                  {getFieldError("temperature") && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
                  )}
                  {isFieldValid("temperature") && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
                  )}
                </div>
                <Badge variant="outline" className="px-3 py-2">
                  °{vitals.temperatureUnit === "celsius" ? "C" : "F"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTemperatureUnitToggle}
                className="h-8 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Switch to {vitals.temperatureUnit === "celsius" ? "°F" : "°C"}
              </Button>
            </div>
            {getFieldError("temperature") && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {getFieldError("temperature")}
              </p>
            )}
            <div className="text-xs text-muted-foreground">
              Normal: {vitals.temperatureUnit === "celsius" ? "36.1-37.2°C" : "97.0-99.0°F"} • Fever:{" "}
              {vitals.temperatureUnit === "celsius" ? "38.0°C+" : "100.4°F+"}
            </div>
          </CardContent>
        </Card>
      </div>

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
