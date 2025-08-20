import { type NextRequest, NextResponse } from "next/server"
import type { AssessmentSubmission, AssessmentResponse } from "@/services/assessment-service"

export async function POST(request: NextRequest) {
  try {
    const data: AssessmentSubmission = await request.json()

    // Validate required fields
    if (!data.demographics || !data.symptoms || data.symptoms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Demographics and symptoms are required",
        },
        { status: 400 },
      )
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock assessment results
    const mockResponse: AssessmentResponse = {
      assessmentId: Math.random().toString(36).substr(2, 9),
      detectionResults: {
        diabetes: {
          score: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
          category: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "moderate" : "low",
          confidence: Math.random() * 0.2 + 0.8, // 0.8 to 1.0
          contributingFactors: [
            {
              feature: "BMI",
              impact: Math.random() * 0.3,
              direction: "positive",
              explanation: "Higher BMI increases diabetes risk",
            },
            {
              feature: "Age",
              impact: Math.random() * 0.2,
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
          score: Math.random() * 0.4 + 0.05,
          category: Math.random() > 0.8 ? "high" : Math.random() > 0.5 ? "moderate" : "low",
          confidence: Math.random() * 0.15 + 0.85,
          contributingFactors: [
            {
              feature: "Blood Pressure",
              impact: Math.random() * 0.25,
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
          score: Math.random() * 0.3 + 0.02,
          category: "low",
          confidence: Math.random() * 0.1 + 0.85,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.87,
            sensitivity: 0.79,
            specificity: 0.83,
            calibration: 0.88,
          },
        },
        ckd: {
          score: Math.random() * 0.2 + 0.02,
          category: "low",
          confidence: Math.random() * 0.1 + 0.8,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.84,
            sensitivity: 0.76,
            specificity: 0.81,
            calibration: 0.86,
          },
        },
        liver: {
          score: Math.random() * 0.15 + 0.01,
          category: "low",
          confidence: Math.random() * 0.1 + 0.85,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.88,
            sensitivity: 0.81,
            specificity: 0.86,
            calibration: 0.89,
          },
        },
        anemia: {
          score: Math.random() * 0.25 + 0.02,
          category: "low",
          confidence: Math.random() * 0.1 + 0.8,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.86,
            sensitivity: 0.78,
            specificity: 0.84,
            calibration: 0.87,
          },
        },
        thyroid: {
          score: Math.random() * 0.2 + 0.02,
          category: "low",
          confidence: Math.random() * 0.1 + 0.8,
          contributingFactors: [],
          modelMetrics: {
            auc: 0.82,
            sensitivity: 0.74,
            specificity: 0.79,
            calibration: 0.85,
          },
        },
      },
      triageResult: {
        urgency: Math.random() > 0.8 ? "red" : Math.random() > 0.4 ? "amber" : "green",
        timeframe: "Within 2-4 weeks",
        actions: [
          "Schedule appointment with primary care physician",
          "Monitor relevant health metrics",
          "Consider lifestyle modifications",
        ],
        warnings: ["Watch for worsening symptoms"],
      },
      processingTime: 2.3,
    }

    return NextResponse.json({
      success: true,
      data: mockResponse,
      message: "Assessment completed successfully",
    })
  } catch (error) {
    console.error("Assessment submission error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
