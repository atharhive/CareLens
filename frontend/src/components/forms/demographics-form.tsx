"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIntakeStore } from "@/stores/intake-store"
import { useUnitConversion } from "@/hooks/use-unit-conversion"
import { calculateBMI, getBMICategory } from "@/utils/conversions"
import { RotateCcw, AlertCircle, CheckCircle } from "lucide-react"
import { validateAge, validateHeight, validateWeight } from "@/utils/validation"

const ETHNICITY_OPTIONS = [
  "White/Caucasian",
  "Black/African American",
  "Hispanic/Latino",
  "Asian",
  "Native American",
  "Pacific Islander",
  "Mixed/Other",
  "Prefer not to say",
]

export function DemographicsForm() {
  const { demographics, setDemographics, errors, clearErrors } = useIntakeStore()
  const { convertHeightValue, convertWeightValue } = useUnitConversion()
  
  // Local state for real-time validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())

  // Real-time validation function
  const validateField = (field: string, value: any) => {
    let error = ""
    
    switch (field) {
      case "age":
        error = validateAge(value) || ""
        break
      case "height":
        error = validateHeight(value, demographics.heightUnit) || ""
        break
      case "weight":
        error = validateWeight(value, demographics.weightUnit) || ""
        break
      case "ethnicity":
        error = !value ? "Ethnicity is required" : ""
        break
      default:
        break
    }
    
    return error
  }

  // Handle input change with real-time validation
  const handleInputChange = (field: keyof typeof demographics, value: string | number) => {
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, field]))
    
    // Update the store
    setDemographics({ [field]: value })
    
    // Validate the field immediately
    const error = validateField(field, value)
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }))
    
    // Clear the error from store if field is now valid
    if (!error && errors[field]) {
      clearErrors()
    }
  }

  // Handle unit toggle with validation
  const handleUnitToggle = (field: "heightUnit" | "weightUnit") => {
    const currentUnit = demographics[field]
    const newUnit = field === "heightUnit" ? (currentUnit === "cm" ? "ft" : "cm") : currentUnit === "kg" ? "lbs" : "kg"

    if (field === "heightUnit" && demographics.height > 0) {
      const convertedHeight = convertHeightValue(
        demographics.height,
        currentUnit as "cm" | "ft",
        newUnit as "cm" | "ft",
      )
      setDemographics({
        heightUnit: newUnit as "cm" | "ft",
        height: convertedHeight,
      })
      
      // Re-validate height with new unit
      const error = validateField("height", convertedHeight)
      setFieldErrors(prev => ({
        ...prev,
        height: error
      }))
    } else if (field === "weightUnit" && demographics.weight > 0) {
      const convertedWeight = convertWeightValue(
        demographics.weight,
        currentUnit as "kg" | "lbs",
        newUnit as "kg" | "lbs",
      )
      setDemographics({
        weightUnit: newUnit as "kg" | "lbs",
        weight: convertedWeight,
      })
      
      // Re-validate weight with new unit
      const error = validateField("weight", convertedWeight)
      setFieldErrors(prev => ({
        ...prev,
        weight: error
      }))
    } else {
      setDemographics({ [field]: newUnit })
    }
  }

  // Get error for a specific field (prioritize local errors over store errors)
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

  const bmi =
    demographics.height > 0 && demographics.weight > 0
      ? calculateBMI(demographics.weight, demographics.height, demographics.weightUnit, demographics.heightUnit)
      : 0

  const bmiCategory = bmi > 0 ? getBMICategory(bmi) : ""

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Age */}
        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <div className="relative">
            <Input
              id="age"
              type="number"
              min="18"
              max="150"
              value={demographics.age || ""}
              onChange={(e) => handleInputChange("age", Number.parseInt(e.target.value) || 0)}
              className={`${getFieldError("age") ? "border-destructive pr-10" : isFieldValid("age") ? "border-green-500 pr-10" : ""}`}
              placeholder="Enter your age"
            />
            {getFieldError("age") && (
              <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
            )}
            {isFieldValid("age") && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
          {getFieldError("age") && <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {getFieldError("age")}
          </p>}
        </div>

        {/* Sex */}
        <div className="space-y-2">
          <Label htmlFor="sex">Biological Sex *</Label>
          <Select value={demographics.sex} onValueChange={(value) => handleInputChange("sex", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select biological sex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Height */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="height">Height *</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnitToggle("heightUnit")}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {demographics.heightUnit === "cm" ? "Switch to ft" : "Switch to cm"}
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="height"
                type="number"
                step="0.1"
                value={demographics.height || ""}
                onChange={(e) => handleInputChange("height", Number.parseFloat(e.target.value) || 0)}
                className={`${getFieldError("height") ? "border-destructive pr-10" : isFieldValid("height") ? "border-green-500 pr-10" : ""}`}
                placeholder={demographics.heightUnit === "cm" ? "170" : "5.7"}
              />
              {getFieldError("height") && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
              {isFieldValid("height") && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <Badge variant="outline" className="px-3 py-2">
              {demographics.heightUnit}
            </Badge>
          </div>
          {getFieldError("height") && <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {getFieldError("height")}
          </p>}
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="weight">Weight *</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleUnitToggle("weightUnit")}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              {demographics.weightUnit === "kg" ? "Switch to lbs" : "Switch to kg"}
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={demographics.weight || ""}
                onChange={(e) => handleInputChange("weight", Number.parseFloat(e.target.value) || 0)}
                className={`${getFieldError("weight") ? "border-destructive pr-10" : isFieldValid("weight") ? "border-green-500 pr-10" : ""}`}
                placeholder={demographics.weightUnit === "kg" ? "70" : "154"}
              />
              {getFieldError("weight") && (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
              {isFieldValid("weight") && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            <Badge variant="outline" className="px-3 py-2">
              {demographics.weightUnit}
            </Badge>
          </div>
          {getFieldError("weight") && <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {getFieldError("weight")}
          </p>}
        </div>
      </div>

      {/* BMI Display */}
      {bmi > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Body Mass Index (BMI)</p>
                <p className="text-2xl font-bold">{bmi.toFixed(1)}</p>
              </div>
              <Badge variant={bmiCategory === "Normal weight" ? "default" : "secondary"}>{bmiCategory}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ethnicity */}
      <div className="space-y-2">
        <Label htmlFor="ethnicity">Ethnicity *</Label>
        <div className="relative">
          <Select value={demographics.ethnicity} onValueChange={(value) => handleInputChange("ethnicity", value)}>
            <SelectTrigger className={`${getFieldError("ethnicity") ? "border-destructive pr-10" : isFieldValid("ethnicity") ? "border-green-500 pr-10" : ""}`}>
              <SelectValue placeholder="Select your ethnicity" />
            </SelectTrigger>
            <SelectContent>
              {ETHNICITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError("ethnicity") && (
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-destructive" />
          )}
          {isFieldValid("ethnicity") && (
            <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-500" />
          )}
        </div>
        {getFieldError("ethnicity") && <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {getFieldError("ethnicity")}
        </p>}
      </div>

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
        <p className="font-medium mb-2">Why we collect this information:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Age and biological sex affect disease risk patterns</li>
          <li>BMI is a key indicator for metabolic health conditions</li>
          <li>Ethnicity influences genetic predisposition to certain diseases</li>
          <li>All information is kept confidential and used only for risk assessment</li>
        </ul>
      </div>
    </div>
  )
}
