"use client"

import { useEffect } from "react"
import { useIntakeStore } from "@/src/stores/intake-store"

export function useFormPersistence() {
  const { demographics, vitals, symptoms, medicalHistory, uploadedFiles, currentStep, completedSteps } =
    useIntakeStore()

  // Auto-save form data to localStorage
  useEffect(() => {
    const formData = {
      demographics,
      vitals,
      symptoms,
      medicalHistory,
      uploadedFiles,
      currentStep,
      completedSteps: Array.from(completedSteps),
      lastSaved: new Date().toISOString(),
    }

    localStorage.setItem("medical-assessment-backup", JSON.stringify(formData))
  }, [demographics, vitals, symptoms, medicalHistory, uploadedFiles, currentStep, completedSteps])

  // Restore form data on page reload
  const restoreFormData = () => {
    try {
      const savedData = localStorage.getItem("medical-assessment-backup")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        const lastSaved = new Date(parsedData.lastSaved)
        const now = new Date()
        const hoursSinceLastSave = (now.getTime() - lastSaved.getTime()) / (1000 * 60 * 60)

        // Only restore if saved within last 24 hours
        if (hoursSinceLastSave < 24) {
          return parsedData
        }
      }
    } catch (error) {
      console.error("Failed to restore form data:", error)
    }
    return null
  }

  const clearSavedData = () => {
    localStorage.removeItem("medical-assessment-backup")
  }

  return {
    restoreFormData,
    clearSavedData,
  }
}
