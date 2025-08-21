import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Demographics, Vitals, MedicalHistory, UploadedFile } from "@/types"
import {
  validateAge,
  validateHeight,
  validateWeight,
  validateBloodPressure,
  validateHeartRate,
  validateTemperature,
} from "@/utils/validation"

interface IntakeState {
  // Form data
  demographics: Demographics
  vitals: Vitals
  symptoms: string[]
  medicalHistory: MedicalHistory
  uploadedFiles: UploadedFile[]
  currentStep: number

  // Validation state
  errors: Record<string, string>
  isValid: boolean

  // Progress tracking
  completedSteps: Set<number>

  // Actions
  setDemographics: (demographics: Partial<Demographics>) => void
  setVitals: (vitals: Partial<Vitals>) => void
  setSymptoms: (symptoms: string[]) => void
  addSymptom: (symptom: string) => void
  removeSymptom: (symptom: string) => void
  setMedicalHistory: (history: Partial<MedicalHistory>) => void
  setUploadedFiles: (files: UploadedFile[]) => void
  addUploadedFile: (file: UploadedFile) => void
  removeUploadedFile: (fileId: string) => void
  updateFileStatus: (fileId: string, status: UploadedFile["processingStatus"]) => void

  // Navigation
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  markStepComplete: (step: number) => void

  // Validation
  validateCurrentStep: () => boolean
  validateDemographics: () => Record<string, string>
  validateVitals: () => Record<string, string>
  clearErrors: () => void

  // Reset
  resetForm: () => void
}

const initialDemographics: Demographics = {
  age: undefined,
  sex: undefined,
  height: undefined,
  weight: undefined,
  ethnicity: undefined,
  heightUnit: "cm",
  weightUnit: "kg",
}

const initialVitals: Vitals = {
  systolicBP: undefined,
  diastolicBP: undefined,
  heartRate: undefined,
  temperature: undefined,
  temperatureUnit: "celsius",
}

const initialMedicalHistory: MedicalHistory = {
  conditions: [],
  medications: [],
  familyHistory: [],
  allergies: [],
}

export const useIntakeStore = create<IntakeState>()(
  persist(
    (set, get) => ({
      // Initial state
      demographics: initialDemographics,
      vitals: initialVitals,
      symptoms: [],
      medicalHistory: initialMedicalHistory,
      uploadedFiles: [],
      currentStep: 0,
      errors: {},
      isValid: false,
      completedSteps: new Set(),

      // Demographics actions
      setDemographics: (demographics) =>
        set((state) => {
          const newDemographics = { ...state.demographics, ...demographics }
          // Validate against the NEW demographics state
          const updatedErrors: Record<string, string> = { ...state.errors }
          const ageError = validateAge(newDemographics.age)
          if (ageError) updatedErrors.age = ageError; else delete updatedErrors.age
          const heightError = validateHeight(newDemographics.height, newDemographics.heightUnit)
          if (heightError) updatedErrors.height = heightError; else delete updatedErrors.height
          const weightError = validateWeight(newDemographics.weight, newDemographics.weightUnit)
          if (weightError) updatedErrors.weight = weightError; else delete updatedErrors.weight
          if (!newDemographics.ethnicity) updatedErrors.ethnicity = "Ethnicity is required"; else delete updatedErrors.ethnicity

          return {
            demographics: newDemographics,
            errors: updatedErrors,
          }
        }),

      // Vitals actions
      setVitals: (vitals) =>
        set((state) => {
          const newVitals = { ...state.vitals, ...vitals }
          // Validate against the NEW vitals state
          const updatedErrors: Record<string, string> = { ...state.errors }
          if (newVitals.systolicBP != null && newVitals.diastolicBP != null) {
            const bpError = validateBloodPressure(newVitals.systolicBP, newVitals.diastolicBP)
            if (bpError) updatedErrors.bloodPressure = bpError; else delete updatedErrors.bloodPressure
          } else {
            delete updatedErrors.bloodPressure
          }
          if (newVitals.heartRate != null) {
            const hrError = validateHeartRate(newVitals.heartRate)
            if (hrError) updatedErrors.heartRate = hrError; else delete updatedErrors.heartRate
          } else {
            delete updatedErrors.heartRate
          }
          if (newVitals.temperature != null) {
            const tempError = validateTemperature(newVitals.temperature, newVitals.temperatureUnit)
            if (tempError) updatedErrors.temperature = tempError; else delete updatedErrors.temperature
          } else {
            delete updatedErrors.temperature
          }

          return {
            vitals: newVitals,
            errors: updatedErrors,
          }
        }),

      // Symptoms actions
      setSymptoms: (symptoms) => set({ symptoms }),
      addSymptom: (symptom) =>
        set((state) => ({
          symptoms: [...state.symptoms, symptom],
        })),
      removeSymptom: (symptom) =>
        set((state) => ({
          symptoms: state.symptoms.filter((s) => s !== symptom),
        })),

      // Medical history actions
      setMedicalHistory: (history) =>
        set((state) => ({
          medicalHistory: { ...state.medicalHistory, ...history },
        })),

      // File upload actions
      setUploadedFiles: (files) => set({ uploadedFiles: files }),
      addUploadedFile: (file) =>
        set((state) => ({
          uploadedFiles: [...state.uploadedFiles, file],
        })),
      removeUploadedFile: (fileId) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
        })),
      updateFileStatus: (fileId, status) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.map((f) => (f.id === fileId ? { ...f, processingStatus: status } : f)),
        })),

      // Navigation actions
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () =>
        set((state) => {
          if (get().validateCurrentStep()) {
            get().markStepComplete(state.currentStep)
            return { currentStep: Math.min(state.currentStep + 1, 5) }
          }
          return state
        }),
      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        })),
      markStepComplete: (step) =>
        set((state) => ({
          completedSteps: new Set([...state.completedSteps, step]),
        })),

      // Validation actions
      validateCurrentStep: () => {
        const state = get()
        let isValid = true
        let errors: Record<string, string> = {}

        switch (state.currentStep) {
          case 0: // Demographics
            errors = get().validateDemographics()
            break
          case 1: // Vitals
            errors = get().validateVitals()
            break
          case 2: // Symptoms
            isValid = state.symptoms.length > 0
            if (!isValid) errors.symptoms = "Please select at least one symptom"
            break
          case 3: // Medical History
            // Optional step, always valid
            break
          case 4: // File Upload
            // Optional step, always valid
            break
          case 5: // Review
            // Validate all previous steps
            errors = {
              ...get().validateDemographics(),
              ...get().validateVitals(),
            }
            if (state.symptoms.length === 0) {
              errors.symptoms = "Please select at least one symptom"
            }
            break
        }

        isValid = Object.keys(errors).length === 0
        set({ errors, isValid })
        return isValid
      },

      validateDemographics: () => {
        const { demographics } = get()
        const errors: Record<string, string> = {}

        const ageError = validateAge(demographics.age)
        if (ageError) errors.age = ageError

        const heightError = validateHeight(demographics.height, demographics.heightUnit)
        if (heightError) errors.height = heightError

        const weightError = validateWeight(demographics.weight, demographics.weightUnit)
        if (weightError) errors.weight = weightError

        if (!demographics.ethnicity) errors.ethnicity = "Ethnicity is required"
        if (!demographics.sex) errors.sex = "Sex is required"

        return errors
      },

      validateVitals: () => {
        const { vitals } = get()
        const errors: Record<string, string> = {}

        if (vitals.systolicBP != null && vitals.diastolicBP != null) {
          const bpError = validateBloodPressure(vitals.systolicBP, vitals.diastolicBP)
          if (bpError) errors.bloodPressure = bpError
        }

        if (vitals.heartRate != null) {
          const hrError = validateHeartRate(vitals.heartRate)
          if (hrError) errors.heartRate = hrError
        }

        if (vitals.temperature != null) {
          const tempError = validateTemperature(vitals.temperature, vitals.temperatureUnit)
          if (tempError) errors.temperature = tempError
        }

        return errors
      },

      clearErrors: () => set({ errors: {} }),

      // Reset action
      resetForm: () =>
        set({
          demographics: initialDemographics,
          vitals: initialVitals,
          symptoms: [],
          medicalHistory: initialMedicalHistory,
          uploadedFiles: [],
          currentStep: 0,
          errors: {},
          isValid: false,
          completedSteps: new Set(),
        }),
    }),
    {
      name: "medical-intake-storage",
      partialize: (state) => ({
        demographics: state.demographics,
        vitals: state.vitals,
        symptoms: state.symptoms,
        medicalHistory: state.medicalHistory,
        uploadedFiles: state.uploadedFiles,
        currentStep: state.currentStep,
        completedSteps: Array.from(state.completedSteps),
      }),
    },
  ),
)
