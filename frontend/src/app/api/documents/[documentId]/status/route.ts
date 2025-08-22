import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function GET(_request: NextRequest, context: { params: { documentId: string } }) {
  try {
    const { documentId } = context.params

    const backendRes = await fetch(`${API_BASE_URL}/extract/file/${documentId}/status`)
    if (!backendRes.ok) {
      const err = await safeJson(backendRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to get document status" }, { status: backendRes.status })
    }

    const json = await backendRes.json()

    return NextResponse.json({ success: true, data: mapToStatus(json) })
  } catch (error) {
    console.error("Document status error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

function mapToStatus(json: any) {
  const status = json.status === "completed" ? "completed" : json.status === "pending" ? "pending" : "processing"
  return {
    id: json.file_id,
    name: json.filename || "",
    type: "",
    size: 0,
    url: "",
    extractedData: undefined,
    processingStatus: status,
  }
}

async function safeJson(res: Response) { try { return await res.json() } catch { return undefined } } 