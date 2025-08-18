import { create } from "zustand"
import type { DetectionResults, TriageResult, Recommendations, ShareSettings } from "@/src/types"

interface ResultsState {
  // Results data
  detectionResults: DetectionResults | null
  triageResult: TriageResult | null
  recommendations: Recommendations | null

  // Loading states
  isLoading: boolean
  isGeneratingPlan: boolean
  isSharing: boolean

  // Error handling
  error: string | null
  retryCount: number

  // Share functionality
  shareSettings: ShareSettings | null
  shareUrl: string | null

  // Actions
  setDetectionResults: (results: DetectionResults) => void
  setTriageResult: (triage: TriageResult) => void
  setRecommendations: (recommendations: Recommendations) => void

  // Loading actions
  setLoading: (loading: boolean) => void
  setGeneratingPlan: (generating: boolean) => void
  setSharing: (sharing: boolean) => void

  // Error actions
  setError: (error: string | null) => void
  incrementRetryCount: () => void
  resetRetryCount: () => void

  // Share actions
  generateShareLink: (settings: Omit<ShareSettings, "id">) => Promise<string>
  setShareSettings: (settings: ShareSettings | null) => void
  setShareUrl: (url: string | null) => void

  // API actions
  submitAssessment: () => Promise<void>
  generatePersonalizedPlan: () => Promise<void>
  retryAssessment: () => Promise<void>

  // Reset
  resetResults: () => void
}

export const useResultsStore = create<ResultsState>((set, get) => ({
  // Initial state
  detectionResults: null,
  triageResult: null,
  recommendations: null,
  isLoading: false,
  isGeneratingPlan: false,
  isSharing: false,
  error: null,
  retryCount: 0,
  shareSettings: null,
  shareUrl: null,

  // Results actions
  setDetectionResults: (results) => set({ detectionResults: results }),
  setTriageResult: (triage) => set({ triageResult: triage }),
  setRecommendations: (recommendations) => set({ recommendations }),

  // Loading actions
  setLoading: (loading) => set({ isLoading: loading }),
  setGeneratingPlan: (generating) => set({ isGeneratingPlan: generating }),
  setSharing: (sharing) => set({ isSharing: sharing }),

  // Error actions
  setError: (error) => set({ error }),
  incrementRetryCount: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetryCount: () => set({ retryCount: 0 }),

  // Share actions
  generateShareLink: async (settings) => {
    set({ isSharing: true, error: null })

    try {
      // Simulate API call to generate share link
      const shareId = Math.random().toString(36).substr(2, 9)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

      const shareSettings: ShareSettings = {
        id: shareId,
        expiresAt,
        ...settings,
      }

      const shareUrl = `${window.location.origin}/shared/${shareId}`

      set({
        shareSettings,
        shareUrl,
        isSharing: false,
      })

      return shareUrl
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to generate share link",
        isSharing: false,
      })
      throw error
    }
  },

  setShareSettings: (settings) => set({ shareSettings: settings }),
  setShareUrl: (url) => set({ shareUrl: url }),

  // API actions
  submitAssessment: async () => {
    set({ isLoading: true, error: null })

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock detection results
      const mockResults: DetectionResults = {
        diabetes: {
          score: 0.23,
          category: "moderate",
          confidence: 0.87,
          contributingFactors: [
            {
              feature: "BMI",
              impact: 0.15,
              direction: "positive",
              explanation: "Higher BMI increases diabetes risk",
            },
            {
              feature: "Age",
              impact: 0.08,
              direction: "positive",
              explanation: "Age is a risk factor for diabetes",
            },
          ],
          modelMetrics: {
            auc: 0.89,
            sensitivity: 0.82,
            specificity: 0.85,
            calibration: 0.91,
          },
        },
        heartDisease: {
          score: 0.18,
          category: "low",
          confidence: 0.92,
          contributingFactors: [
            {
              feature: "Blood Pressure",
              impact: 0.12,
              direction: "positive",
              explanation: "Elevated blood pressure increases cardiovascular risk",
            },
          ],
          modelMetrics: {
            auc: 0.91,
            sensitivity: 0.85,
            specificity: 0.88,
            calibration: 0.93,
          },
        },
        stroke: {
          score: 0.12,
          category: "low",
          confidence: 0.89,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.87,
            sensitivity: 0.79,
            specificity: 0.83,
            calibration: 0.88,
          },
        },
        ckd: {
          score: 0.08,
          category: "low",
          confidence: 0.85,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.84,
            sensitivity: 0.76,
            specificity: 0.81,
            calibration: 0.86,
          },
        },
        liver: {
          score: 0.05,
          category: "low",
          confidence: 0.91,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.88,
            sensitivity: 0.81,
            specificity: 0.86,
            calibration: 0.89,
          },
        },
        anemia: {
          score: 0.15,
          category: "low",
          confidence: 0.88,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.86,
            sensitivity: 0.78,
            specificity: 0.84,
            calibration: 0.87,
          },
        },
        thyroid: {
          score: 0.11,
          category: "low",
          confidence: 0.83,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.82,
            sensitivity: 0.74,
            specificity: 0.79,
            calibration: 0.85,
          },
        },
      }

      const mockTriage: TriageResult = {
        urgency: "amber",
        timeframe: "Within 2-4 weeks",
        actions: [
          "Schedule appointment with primary care physician",
          "Monitor blood glucose levels",
          "Consider lifestyle modifications",
        ],
        warnings: ["Watch for symptoms of diabetes such as increased thirst or frequent urination"],
      }

      set({
        detectionResults: mockResults,
        triageResult: mockTriage,
        isLoading: false,
        error: null,
      })

      get().resetRetryCount()
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Assessment failed",
        isLoading: false,
      })
      throw error
    }
  },

  generatePersonalizedPlan: async () => {
    set({ isGeneratingPlan: true, error: null })

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockRecommendations: Recommendations = {
        immediate: [
          {
            id: "1",
            title: "Schedule Primary Care Visit",
            description: "Book an appointment with your primary care physician to discuss your risk assessment results",
            priority: "high",
            timeframe: "Within 2 weeks",
          },
          {
            id: "2",
            title: "Blood Glucose Monitoring",
            description: "Begin monitoring your blood glucose levels, especially after meals",
            priority: "medium",
            timeframe: "Start immediately",
          },
        ],
        lifestyle: [
          {
            category: "diet",
            title: "Reduce Sugar Intake",
            description: "Limit processed foods and sugary beverages to help manage blood glucose levels",
            specifics: [
              "Avoid sodas and fruit juices",
              "Choose whole grains over refined carbohydrates",
              "Increase fiber intake with vegetables and legumes",
            ],
          },
          {
            category: "exercise",
            title: "Regular Physical Activity",
            description: "Incorporate moderate exercise to improve insulin sensitivity",
            specifics: [
              "30 minutes of brisk walking 5 days per week",
              "Include strength training 2 days per week",
              "Consider activities like swimming or cycling",
            ],
          },
        ],
        followUp: [
          {
            type: "lab",
            title: "HbA1c Test",
            timeframe: "Within 3 months",
            description: "Monitor long-term blood glucose control",
          },
          {
            type: "appointment",
            title: "Endocrinologist Consultation",
            timeframe: "If recommended by primary care",
            description: "Specialist evaluation for diabetes risk management",
          },
        ],
        educational: [
          {
            title: "Understanding Diabetes Risk",
            description: "Learn about prediabetes and type 2 diabetes prevention",
            url: "https://example.com/diabetes-education",
            type: "article",
          },
          {
            title: "Healthy Eating for Diabetes Prevention",
            description: "Nutritional guidance for managing blood glucose",
            url: "https://example.com/nutrition-guide",
            type: "pdf",
          },
        ],
      }

      set({
        recommendations: mockRecommendations,
        isGeneratingPlan: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to generate personalized plan",
        isGeneratingPlan: false,
      })
      throw error
    }
  },

  retryAssessment: async () => {
    get().incrementRetryCount()
    await get().submitAssessment()
  },

  // Reset action
  resetResults: () =>
    set({
      detectionResults: null,
      triageResult: null,
      recommendations: null,
      isLoading: false,
      isGeneratingPlan: false,
      isSharing: false,
      error: null,
      retryCount: 0,
      shareSettings: null,
      shareUrl: null,
    }),
}))
