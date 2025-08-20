import { type NextRequest, NextResponse } from "next/server"
import type { PersonalizedPlanRequest } from "@/services/recommendations-service"
import type { Recommendations } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const data: PersonalizedPlanRequest = await request.json()

    if (!data.assessmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Assessment ID is required",
        },
        { status: 400 },
      )
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Mock recommendations
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
          title: "Monitor Key Health Metrics",
          description: "Begin tracking blood pressure, weight, and other relevant health indicators",
          priority: "medium",
          timeframe: "Start immediately",
        },
      ],
      lifestyle: [
        {
          category: "diet",
          title: "Heart-Healthy Diet",
          description: "Adopt a Mediterranean-style diet to reduce cardiovascular risk",
          specifics: [
            "Increase intake of fruits and vegetables",
            "Choose whole grains over refined carbohydrates",
            "Include omega-3 rich fish twice per week",
            "Limit processed foods and added sugars",
          ],
        },
        {
          category: "exercise",
          title: "Regular Physical Activity",
          description: "Incorporate moderate exercise to improve overall health",
          specifics: [
            "30 minutes of brisk walking 5 days per week",
            "Include strength training 2 days per week",
            "Start slowly and gradually increase intensity",
            "Consider activities you enjoy to maintain consistency",
          ],
        },
        {
          category: "monitoring",
          title: "Health Tracking",
          description: "Monitor key health indicators regularly",
          specifics: [
            "Check blood pressure weekly",
            "Track weight changes monthly",
            "Monitor symptoms and energy levels",
            "Keep a health journal",
          ],
        },
      ],
      followUp: [
        {
          type: "lab",
          title: "Comprehensive Metabolic Panel",
          timeframe: "Within 3 months",
          description: "Monitor blood glucose, kidney function, and electrolyte balance",
        },
        {
          type: "appointment",
          title: "Specialist Consultation",
          timeframe: "If recommended by primary care",
          description: "Consider specialist evaluation based on risk factors",
        },
        {
          type: "screening",
          title: "Cardiovascular Screening",
          timeframe: "Annually",
          description: "Regular cardiovascular health assessment",
        },
      ],
      educational: [
        {
          title: "Understanding Your Health Risks",
          description: "Learn about your specific risk factors and how to manage them",
          url: "https://example.com/health-risks",
          type: "article",
        },
        {
          title: "Heart-Healthy Living Guide",
          description: "Comprehensive guide to cardiovascular health",
          url: "https://example.com/heart-health-guide",
          type: "pdf",
        },
        {
          title: "Nutrition for Health",
          description: "Video series on healthy eating habits",
          url: "https://example.com/nutrition-videos",
          type: "video",
        },
      ],
    }

    return NextResponse.json({
      success: true,
      data: mockRecommendations,
      message: "Personalized plan generated successfully",
    })
  } catch (error) {
    console.error("Recommendations generation error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
