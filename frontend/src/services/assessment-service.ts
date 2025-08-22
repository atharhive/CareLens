import { apiRequest, ApiError } from "@/lib/api-client"
import type { Demographics, Vitals, MedicalHistory, UploadedFile, DetectionResults, TriageResult } from "@/types"

export interface AssessmentSubmission {
  demographics: Demographics
  vitals: Vitals
  symptoms: string[]
  medicalHistory: MedicalHistory
  uploadedFiles: UploadedFile[]
}

export interface AssessmentResponse {
  assessmentId: string
  detectionResults: DetectionResults
  triageResult: TriageResult
  processingTime: number
}

export class AssessmentService {
  // Submit assessment for analysis
  static async submitAssessment(data: AssessmentSubmission): Promise<AssessmentResponse> {
    try {
      const response = await apiRequest<AssessmentResponse>({
        method: "POST",
        url: "/assessment/submit",
        data,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle specific API errors
        switch (error.status) {
          case 400:
            throw new ApiError("Invalid assessment data. Please check your inputs.", 400, "INVALID_DATA")
          case 429:
            throw new ApiError("Too many requests. Please wait a moment and try again.", 429, "RATE_LIMITED")
          case 503:
            throw new ApiError(
              "Assessment service is temporarily unavailable. Please try again later.",
              503,
              "SERVICE_UNAVAILABLE",
            )
          default:
            throw new ApiError("Failed to process assessment. Please try again.", error.status, error.code)
        }
      }
      throw error
    }
  }

  // Get assessment results by ID
  static async getAssessmentResults(assessmentId: string): Promise<AssessmentResponse> {
    try {
      const response = await apiRequest<AssessmentResponse>({
        method: "GET",
        url: `/assessment/${assessmentId}`,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError("Assessment not found. Please submit a new assessment.", 404, "NOT_FOUND")
      }
      throw error
    }
  }

  // Upload and process medical documents
  static async uploadDocument(file: File): Promise<UploadedFile> {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await apiRequest<UploadedFile>({
        method: "POST",
        url: "/documents/upload",
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 413:
            throw new ApiError("File is too large. Please upload a file smaller than 10MB.", 413, "FILE_TOO_LARGE")
          case 415:
            throw new ApiError("Unsupported file type. Please upload PDF, JPEG, or PNG files.", 415, "UNSUPPORTED_TYPE")
          default:
            throw new ApiError("Failed to upload document. Please try again.", error.status, error.code)
        }
      }
      throw error
    }
  }

  // Get document processing status
  static async getDocumentStatus(documentId: string): Promise<UploadedFile> {
    try {
      const response = await apiRequest<UploadedFile>({
        method: "GET",
        url: `/documents/${documentId}/status`,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError("Document not found.", 404, "NOT_FOUND")
      }
      throw error
    }
  }
}
