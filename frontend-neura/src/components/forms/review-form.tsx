"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useIntakeStore } from "@/src/stores/intake-store"
import { useResultsStore } from "@/src/stores/results-store"
import { calculateBMI, getBMICategory } from "@/src/utils/conversions"
import { User, Activity, Stethoscope, FileText, Upload, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export function ReviewForm() {
  const { demographics, vitals, symptoms, medicalHistory, uploadedFiles } = useIntakeStore()
  const { submitAssessment, isLoading } = useResultsStore()
  const router = useRouter()

  const bmi =
    demographics.height > 0 && demographics.weight > 0
      ? calculateBMI(demographics.weight, demographics.height, demographics.weightUnit, demographics.heightUnit)
      : 0

  const handleSubmit = async () => {
    try {
      await submitAssessment()
      router.push("/results")
    } catch (error) {
      console.error("Assessment submission failed:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">Review Your Information</h3>
        <p className="text-muted-foreground">
          Please review all the information below before submitting your assessment.
        </p>
      </div>

      {/* Demographics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Demographics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Age</p>
              <p className="font-medium">{demographics.age} years old</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Biological Sex</p>
              <p className="font-medium capitalize">{demographics.sex}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Height</p>
              <p className="font-medium">
                {demographics.height} {demographics.heightUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Weight</p>
              <p className="font-medium">
                {demographics.weight} {demographics.weightUnit}
              </p>
            </div>
          </div>

          {bmi > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
              <div>
                <p className="text-sm text-muted-foreground">BMI</p>
                <p className="font-medium">{bmi}</p>
              </div>
              <Badge variant="outline">{getBMICategory(bmi)}</Badge>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Ethnicity</p>
            <p className="font-medium">{demographics.ethnicity}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vitals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vitals.systolicBP || vitals.diastolicBP || vitals.heartRate || vitals.temperature ? (
            <div className="grid md:grid-cols-2 gap-4">
              {vitals.systolicBP && vitals.diastolicBP && (
                <div>
                  <p className="text-sm text-muted-foreground">Blood Pressure</p>
                  <p className="font-medium">
                    {vitals.systolicBP}/{vitals.diastolicBP} mmHg
                  </p>
                </div>
              )}
              {vitals.heartRate && (
                <div>
                  <p className="text-sm text-muted-foreground">Heart Rate</p>
                  <p className="font-medium">{vitals.heartRate} bpm</p>
                </div>
              )}
              {vitals.temperature && (
                <div>
                  <p className="text-sm text-muted-foreground">Temperature</p>
                  <p className="font-medium">
                    {vitals.temperature}°{vitals.temperatureUnit === "celsius" ? "C" : "F"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No vital signs recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Symptoms Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Symptoms ({symptoms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {symptoms.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <Badge key={index} variant="outline">
                  {symptom}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No symptoms reported</p>
          )}
        </CardContent>
      </Card>

      {/* Medical History Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Conditions */}
          <div>
            <p className="text-sm font-medium mb-2">Medical Conditions ({medicalHistory.conditions.length})</p>
            {medicalHistory.conditions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medicalHistory.conditions.map((condition, index) => (
                  <Badge key={index} variant="secondary">
                    {condition}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm">None reported</p>
            )}
          </div>

          <Separator />

          {/* Medications */}
          <div>
            <p className="text-sm font-medium mb-2">Current Medications ({medicalHistory.medications.length})</p>
            {medicalHistory.medications.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medicalHistory.medications.map((medication, index) => (
                  <Badge key={index} variant="outline">
                    {medication}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm">None reported</p>
            )}
          </div>

          <Separator />

          {/* Family History */}
          <div>
            <p className="text-sm font-medium mb-2">Family History ({medicalHistory.familyHistory.length})</p>
            {medicalHistory.familyHistory.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {medicalHistory.familyHistory.map((condition, index) => (
                  <Badge key={index} variant="outline">
                    {condition}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-sm">None reported</p>
            )}
          </div>

          {/* Allergies */}
          {medicalHistory.allergies.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Allergies ({medicalHistory.allergies.length})</p>
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Documents Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Uploaded Documents ({uploadedFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length > 0 ? (
            <div className="space-y-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                  <span className="text-sm font-medium">{file.name}</span>
                  <div className="flex items-center gap-2">
                    {file.processingStatus === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    <Badge variant="outline" className="text-xs">
                      {file.processingStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No documents uploaded</p>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h4 className="font-semibold">Ready to Submit Your Assessment</h4>
              <p className="text-sm text-muted-foreground">
                Our AI will analyze your information and provide personalized health risk insights. This process
                typically takes 2-3 minutes.
              </p>
            </div>

            <Button onClick={handleSubmit} disabled={isLoading} size="lg" className="w-full md:w-auto px-12">
              {isLoading ? "Processing Assessment..." : "Submit Assessment"}
            </Button>

            <p className="text-xs text-muted-foreground">
              By submitting, you agree to our terms of service and privacy policy. Your data is processed securely and
              confidentially.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
