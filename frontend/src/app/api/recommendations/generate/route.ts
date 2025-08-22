import { type NextRequest, NextResponse } from "next/server"
import type { PersonalizedPlanRequest } from "@/services/recommendations-service"
import type { Recommendations } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const data: PersonalizedPlanRequest = await request.json()

    if (!data.assessmentId) {
      return NextResponse.json(
        { success: false, message: "Assessment ID is required" },
        { status: 400 },
      )
    }

    const backendRes = await fetch(`${API_BASE_URL}/recommend/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: data.assessmentId,
        recommendation_types: ["lifestyle", "dietary", "monitoring", "follow_up"],
        cultural_preferences: undefined,
        lifestyle_goals: data.preferences?.focusAreas,
      }),
    })

    if (!backendRes.ok) {
      const err = await safeJson(backendRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to generate recommendations" }, { status: backendRes.status })
    }

    const backendJson = await backendRes.json()

    const recommendations: Recommendations = mapBackendToFrontend(backendJson)

    return NextResponse.json({ success: true, data: recommendations, message: "Personalized plan generated successfully" })
  } catch (error) {
    console.error("Recommendations generation error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    )
  }
}

async function safeJson(res: Response) { try { return await res.json() } catch { return undefined } }

function mapBackendToFrontend(backendJson: any): Recommendations {
  const recs = backendJson?.recommendations || backendJson || {}

  const lifestyle: any[] = recs.lifestyle || recs.lifestyle_recommendations || []
  const followUp: any[] = recs.follow_up || recs.follow_up_recommendations || []
  const educational: string[] = recs.educational || recs.educational_resources || []

  return {
    immediate: [],
    lifestyle: lifestyle.map((r: any) => ({
      category: (r.category || "diet") as any,
      title: r.recommendation || r.title || "",
      description: r.recommendation || r.description || "",
      specifics: r.personalization_factors || [],
    })),
    followUp: followUp.map((r: any) => ({
      type: (r.test_type ? "lab" : "appointment") as any,
      title: r.test_type || r.title || "",
      timeframe: r.timeframe || "",
      description: r.reason || r.description || "",
    })),
    educational: educational.map((e: any) => ({
      title: typeof e === "string" ? e : e.title || "",
      description: typeof e === "string" ? "" : e.description || "",
      url: typeof e === "string" ? e : e.url || "",
      type: "article",
    })),
  }
} 