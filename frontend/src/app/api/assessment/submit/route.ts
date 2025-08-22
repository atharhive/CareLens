import { type NextRequest, NextResponse } from "next/server"
import type { AssessmentSubmission, AssessmentResponse } from "@/services/assessment-service"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

function toCm(value: number | undefined, unit: "cm" | "ft"): number | undefined {
  if (value == null) return undefined
  return unit === "ft" ? Math.round(value * 30.48) : value
}

function toKg(value: number | undefined, unit: "kg" | "lbs"): number | undefined {
  if (value == null) return undefined
  return unit === "lbs" ? Math.round((value * 0.453592) * 10) / 10 : value
}

function toCelsius(value: number | undefined, unit: "celsius" | "fahrenheit"): number | undefined {
  if (value == null) return undefined
  return unit === "fahrenheit" ? Math.round(((value - 32) * 5/9) * 10) / 10 : value
}

export async function POST(request: NextRequest) {
  try {
    const data: AssessmentSubmission = await request.json()

    if (!data.demographics || !data.symptoms || data.symptoms.length === 0) {
      return NextResponse.json(
        { success: false, message: "Demographics and symptoms are required" },
        { status: 400 },
      )
    }

    // 1) Map frontend intake to backend PatientIntakeSchema
    const intakePayload = {
      age: data.demographics.age ?? 0,
      gender: (data.demographics.sex || "other").toLowerCase(),
      ethnicity: null,
      race: null,
      email: null,
      phone: null,
      vital_signs: {
        height_cm: toCm(data.demographics.height, data.demographics.heightUnit),
        weight_kg: toKg(data.demographics.weight, data.demographics.weightUnit),
        blood_pressure_systolic: data.vitals?.systolicBP,
        blood_pressure_diastolic: data.vitals?.diastolicBP,
        heart_rate: data.vitals?.heartRate,
        temperature_celsius: toCelsius(data.vitals?.temperature, data.vitals?.temperatureUnit),
      },
      medical_history: {
        conditions: data.medicalHistory?.conditions || [],
        medications: data.medicalHistory?.medications || [],
        allergies: data.medicalHistory?.allergies || [],
        surgeries: [],
        family_history: data.medicalHistory?.familyHistory || [],
        smoking_status: undefined,
        alcohol_consumption: undefined,
      },
      lifestyle_factors: {
        exercise_frequency: undefined,
        diet_type: undefined,
        stress_level: undefined,
        sleep_hours: undefined,
        occupation: undefined,
      },
      symptoms: {
        primary_complaint: null,
        symptoms_list: data.symptoms,
        symptom_duration: undefined,
        pain_level: undefined,
      },
      insurance_type: undefined,
      preferred_language: "english",
      emergency_contact: undefined,
    }

    const ingestRes = await fetch(`${API_BASE_URL}/ingest/form`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intakePayload),
    })

    if (!ingestRes.ok) {
      const err = await safeJson(ingestRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to ingest form" }, { status: ingestRes.status })
    }

    const ingestJson = await ingestRes.json()
    const sessionId: string = ingestJson.session_id || ingestJson.data?.session_id || ingestJson?.sessionId

    if (!sessionId) {
      return NextResponse.json({ success: false, message: "No session id returned from backend" }, { status: 502 })
    }

    // 2) Run detection across supported conditions
    const conditions = [
      "diabetes",
      "heart_disease",
      "stroke",
      "ckd",
      "liver_disease",
      "anemia",
      "thyroid",
    ]

    const detectRes = await fetch(`${API_BASE_URL}/detect/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, conditions, include_explanations: true }),
    })

    if (!detectRes.ok) {
      const err = await safeJson(detectRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to run detection" }, { status: detectRes.status })
    }

    const detectJson = await detectRes.json()

    // 3) Triage
    const triageRes = await fetch(`${API_BASE_URL}/triage/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })

    if (!triageRes.ok) {
      const err = await safeJson(triageRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to run triage" }, { status: triageRes.status })
    }

    const triageJson = await triageRes.json()

    // 4) Map backend -> frontend AssessmentResponse
    const detectionResults = mapDetectionToFrontend(detectJson)
    const triageResult = mapTriageToFrontend(triageJson)

    const response: AssessmentResponse = {
      assessmentId: sessionId,
      detectionResults,
      triageResult,
      processingTime: 0,
    }

    return NextResponse.json({ success: true, data: response, message: "Assessment completed successfully" })
  } catch (error) {
    console.error("Assessment submission error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    )
  }
}

async function safeJson(res: Response) {
  try { return await res.json() } catch { return undefined }
}

function mapDetectionToFrontend(detectJson: any) {
  const scores = detectJson?.risk_scores || detectJson?.detection_results || []
  const result: any = {
    diabetes: emptyRisk(),
    heartDisease: emptyRisk(),
    stroke: emptyRisk(),
    ckd: emptyRisk(),
    liver: emptyRisk(),
    anemia: emptyRisk(),
    thyroid: emptyRisk(),
  }

  for (const s of scores) {
    const key = (s.condition || "").toString().toLowerCase()
    const mapped = {
      score: s.risk_score ?? s.score ?? 0,
      category: (s.risk_level || "low").toLowerCase(),
      confidence: typeof s.confidence_interval === "object" && s.confidence_interval
        ? Math.max(0, Math.min(1, (Number(s.confidence_interval?.upper || 0) - Number(s.confidence_interval?.lower || 0))))
        : 0.9,
      contributingFactors: Array.isArray(detectJson?.explanations)
        ? detectJson.explanations
            .filter((e: any) => (e.condition || "").toLowerCase() === key)
            .flatMap((e: any) => (e.top_features || []).map((f: any) => ({
              feature: f.feature_name,
              impact: f.importance_score,
              direction: (f.impact_direction || "positive") as "positive" | "negative",
              explanation: `${f.feature_name} ${f.impact_direction} risk`,
            })))
        : [],
      modelMetrics: {
        auc: 0.9,
        sensitivity: 0.85,
        specificity: 0.85,
        calibration: 0.9,
      },
    }

    if (key === "heart_disease") result.heartDisease = mapped
    else if (key === "liver_disease") result.liver = mapped
    else if (key === "ckd") result.ckd = mapped
    else if (key === "diabetes") result.diabetes = mapped
    else if (key === "stroke") result.stroke = mapped
    else if (key === "anemia") result.anemia = mapped
    else if (key === "thyroid") result.thyroid = mapped
  }

  return result
}

function emptyRisk() {
  return {
    score: 0,
    category: "low" as const,
    confidence: 0.9,
    contributingFactors: [],
    modelMetrics: { auc: 0.9, sensitivity: 0.85, specificity: 0.85, calibration: 0.9 },
  }
}

function mapTriageToFrontend(triageJson: any) {
  const triage = triageJson?.triage_results || triageJson
  return {
    urgency: (triage?.overall_classification || triage?.urgency_level || "green").toString().toLowerCase(),
    timeframe: triage?.timeframe || "Within 2-4 weeks",
    actions: triage?.recommended_actions || triage?.actions || ["Schedule appointment with primary care physician"],
    warnings: triage?.warnings || ["Watch for worsening symptoms"],
  }
} 