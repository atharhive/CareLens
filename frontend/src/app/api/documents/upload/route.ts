import { NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const backendRes = await fetch(`${API_BASE_URL}/ingest/file`, {
      method: "POST",
      body: formData,
    })

    if (!backendRes.ok) {
      const err = await safeJson(backendRes)
      return NextResponse.json({ success: false, message: err?.detail || "Failed to upload document" }, { status: backendRes.status })
    }

    const json = await backendRes.json()

    return NextResponse.json({ success: true, data: mapToUploadedFile(json) })
  } catch (error) {
    console.error("Document upload error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

function mapToUploadedFile(json: any) {
  return {
    id: json.file_id,
    name: json.filename,
    type: json.file_type,
    size: json.file_size,
    url: "",
    extractedData: undefined,
    processingStatus: "pending" as const,
  }
}

async function safeJson(res: Response) { try { return await res.json() } catch { return undefined } } 