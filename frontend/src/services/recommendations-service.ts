import { apiRequest, ApiError } from "@/lib/api-client"
import type { Recommendations, ShareSettings } from "@/types"

export interface PersonalizedPlanRequest {
  assessmentId: string
  preferences?: {
    focusAreas?: string[]
    timeframe?: "immediate" | "short-term" | "long-term"
    complexity?: "basic" | "detailed"
  }
}

export class RecommendationsService {
  // Generate personalized health plan
  static async generatePersonalizedPlan(request: PersonalizedPlanRequest): Promise<Recommendations> {
    try {
      const response = await apiRequest<Recommendations>({
        method: "POST",
        url: "/recommendations/generate",
        data: request,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            throw new ApiError(
              "Assessment not found. Please complete an assessment first.",
              404,
              "ASSESSMENT_NOT_FOUND",
            )
          case 422:
            throw new ApiError("Unable to generate recommendations. Please try again.", 422, "GENERATION_FAILED")
          default:
            throw new ApiError("Failed to generate personalized plan. Please try again.", error.status, error.code)
        }
      }
      throw error
    }
  }

  // Create shareable link
  static async createShareLink(assessmentId: string, settings: Omit<ShareSettings, "id">): Promise<ShareSettings> {
    try {
      const response = await apiRequest<ShareSettings>({
        method: "POST",
        url: "/share/create",
        data: {
          assessmentId,
          ...settings,
        },
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            throw new ApiError("Assessment not found.", 404, "ASSESSMENT_NOT_FOUND")
          default:
            throw new ApiError("Failed to create share link. Please try again.", error.status, error.code)
        }
      }
      throw error
    }
  }

  // Get shared assessment
  static async getSharedAssessment(shareId: string, password?: string): Promise<any> {
    try {
      const response = await apiRequest<any>({
        method: "GET",
        url: `/share/${shareId}`,
        data: password ? { password } : undefined,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            throw new ApiError("Shared assessment not found or has expired.", 404, "NOT_FOUND")
          case 401:
            throw new ApiError("Password required to access this assessment.", 401, "PASSWORD_REQUIRED")
          case 403:
            throw new ApiError("Incorrect password.", 403, "INVALID_PASSWORD")
          default:
            throw new ApiError("Failed to access shared assessment.", error.status, error.code)
        }
      }
      throw error
    }
  }
}
