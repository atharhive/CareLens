"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIntakeStore } from "@/src/stores/intake-store"
import { useUnitConversion } from "@/src/hooks/use-unit-conversion"
import { calculateBMI, getBMICategory } from "@/src/utils/conversions"
import { RotateCcw } from "lucide-react"

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
  const { demographics, setDemographics, errors } = useIntakeStore()
  const { convertHeightValue, convertWeightValue } = useUnitConversion()

  const handleInputChange = (field: keyof typeof demographics, value: string | number) => {
    setDemographics({ [field]: value })
  }

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
    } else {
      setDemographics({ [field]: newUnit })
    }
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
          <Input
            id="age"
            type="number"
            min="18"
            max="150"
            value={demographics.age || ""}
            onChange={(e) => handleInputChange("age", Number.parseInt(e.target.value) || 0)}
            className={errors.age ? "border-destructive" : ""}
            placeholder="Enter your age"
          />
          {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
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
            <Input
              id="height"
              type="number"
              step="0.1"
              value={demographics.height || ""}
              onChange={(e) => handleInputChange("height", Number.parseFloat(e.target.value) || 0)}
              className={errors.height ? "border-destructive" : ""}
              placeholder={demographics.heightUnit === "cm" ? "170" : "5.7"}
            />
            <Badge variant="outline" className="px-3 py-2">
              {demographics.heightUnit}
            </Badge>
          </div>
          {errors.height && <p className="text-sm text-destructive">{errors.height}</p>}
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
            <Input
              id="weight"
              type="number"
              step="0.1"
              value={demographics.weight || ""}
              onChange={(e) => handleInputChange("weight", Number.parseFloat(e.target.value) || 0)}
              className={errors.weight ? "border-destructive" : ""}
              placeholder={demographics.weightUnit === "kg" ? "70" : "154"}
            />
            <Badge variant="outline" className="px-3 py-2">
              {demographics.weightUnit}
            </Badge>
          </div>
          {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
        </div>
      </div>

      {/* BMI Display */}
      {bmi > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Body Mass Index (BMI)</p>
                <p className="text-2xl font-bold">{bmi}</p>
              </div>
              <Badge variant={bmiCategory === "Normal weight" ? "default" : "secondary"}>{bmiCategory}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ethnicity */}
      <div className="space-y-2">
        <Label htmlFor="ethnicity">Ethnicity *</Label>
        <Select value={demographics.ethnicity} onValueChange={(value) => handleInputChange("ethnicity", value)}>
          <SelectTrigger className={errors.ethnicity ? "border-destructive" : ""}>
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
        {errors.ethnicity && <p className="text-sm text-destructive">{errors.ethnicity}</p>}
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
