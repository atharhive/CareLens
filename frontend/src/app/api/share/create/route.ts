import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const assessmentId: string | undefined = body.assessmentId
    const includePersonal = Boolean(body.includePersonal)
    const expiryDays = Number(body.expiresInDays ?? 7)

    if (!assessmentId) {
      return NextResponse.json({ success: false, message: "Assessment ID is required" }, { status: 400 })
    }

    const backendRes = await fetch(`${API_BASE_URL}/share/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: assessmentId,
        include_personal_info: includePersonal,
        expiry_days: expiryDays,
        password_protect: false,
      }),
    })

    if (!backendRes.ok) {
      const err = await safeJson(backendRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to create share link" }, { status: backendRes.status })
    }

    const json = await backendRes.json()

    return NextResponse.json({ success: true, data: json })
  } catch (error) {
    console.error("Share link error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

async function safeJson(res: Response) { try { return await res.json() } catch { return undefined } } 