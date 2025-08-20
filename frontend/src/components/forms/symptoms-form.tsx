"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIntakeStore } from "@/stores/intake-store"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

const COMMON_SYMPTOMS = [
  { id: "chest-pain", label: "Chest pain or discomfort", category: "Cardiovascular" },
  { id: "shortness-breath", label: "Shortness of breath", category: "Cardiovascular" },
  { id: "fatigue", label: "Unusual fatigue or weakness", category: "General" },
  { id: "dizziness", label: "Dizziness or lightheadedness", category: "Neurological" },
  { id: "palpitations", label: "Heart palpitations", category: "Cardiovascular" },
  { id: "excessive-thirst", label: "Excessive thirst", category: "Metabolic" },
  { id: "frequent-urination", label: "Frequent urination", category: "Metabolic" },
  { id: "blurred-vision", label: "Blurred vision", category: "Metabolic" },
  { id: "unexplained-weight-loss", label: "Unexplained weight loss", category: "General" },
  { id: "unexplained-weight-gain", label: "Unexplained weight gain", category: "General" },
  { id: "persistent-cough", label: "Persistent cough", category: "Respiratory" },
  { id: "swelling", label: "Swelling in legs, ankles, or feet", category: "Cardiovascular" },
  { id: "nausea", label: "Nausea or vomiting", category: "Gastrointestinal" },
  { id: "abdominal-pain", label: "Abdominal pain", category: "Gastrointestinal" },
  { id: "headaches", label: "Frequent headaches", category: "Neurological" },
  { id: "skin-changes", label: "Skin changes or rashes", category: "Dermatological" },
  { id: "joint-pain", label: "Joint pain or stiffness", category: "Musculoskeletal" },
  { id: "sleep-problems", label: "Sleep problems", category: "General" },
  { id: "mood-changes", label: "Mood changes or depression", category: "Mental Health" },
  { id: "memory-problems", label: "Memory or concentration problems", category: "Neurological" },
]

const SYMPTOM_CATEGORIES = Array.from(new Set(COMMON_SYMPTOMS.map((s) => s.category)))

export function SymptomsForm() {
  const { symptoms, setSymptoms, addSymptom, removeSymptom, errors } = useIntakeStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [additionalSymptoms, setAdditionalSymptoms] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const filteredSymptoms = COMMON_SYMPTOMS.filter((symptom) => {
    const matchesSearch = symptom.label.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || symptom.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSymptomToggle = (symptomId: string, symptomLabel: string) => {
    if (symptoms.includes(symptomLabel)) {
      removeSymptom(symptomLabel)
    } else {
      addSymptom(symptomLabel)
    }
  }

  const handleAdditionalSymptomsChange = (value: string) => {
    setAdditionalSymptoms(value)

    // Parse additional symptoms and add them to the list
    const additionalList = value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // Remove old additional symptoms and add new ones
    const currentSymptoms = symptoms.filter((s) => COMMON_SYMPTOMS.some((cs) => cs.label === s))

    setSymptoms([...currentSymptoms, ...additionalList])
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Current Symptoms</h3>
          <p className="text-sm text-muted-foreground">
            Select any symptoms you are currently experiencing or have experienced recently.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === "All" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("All")}
            >
              All
            </Badge>
            {SYMPTOM_CATEGORIES.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Symptoms Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredSymptoms.map((symptom) => (
          <Card key={symptom.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id={symptom.id}
                  checked={symptoms.includes(symptom.label)}
                  onCheckedChange={() => handleSymptomToggle(symptom.id, symptom.label)}
                />
                <div className="flex-1">
                  <Label htmlFor={symptom.id} className="text-sm font-medium cursor-pointer">
                    {symptom.label}
                  </Label>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {symptom.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Symptoms Summary */}
      {symptoms.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Selected Symptoms ({symptoms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeSymptom(symptom)}
                >
                  {symptom} ×
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Symptoms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Symptoms</CardTitle>
          <CardDescription>Describe any other symptoms not listed above, separated by commas</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g., tingling in hands, unusual bruising, changes in appetite..."
            value={additionalSymptoms}
            onChange={(e) => handleAdditionalSymptomsChange(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {errors.symptoms && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <p className="text-sm text-destructive">{errors.symptoms}</p>
        </div>
      )}

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
        <p className="font-medium mb-2">Important notes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Select all symptoms you are currently experiencing</li>
          <li>Include symptoms from the past 2-3 months</li>
          <li>If you have severe symptoms, seek immediate medical attention</li>
          <li>This assessment does not replace professional medical evaluation</li>
        </ul>
      </div>
    </div>
  )
}
