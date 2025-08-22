import { type NextRequest, NextResponse } from "next/server"
import type { ProviderSearchRequest, ProviderSearchResponse } from "@/services/provider-service"
import type { Provider } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function POST(request: NextRequest) {
  try {
    const data: ProviderSearchRequest = await request.json()

    if (!data.location) {
      return NextResponse.json(
        { success: false, message: "Location is required" },
        { status: 400 },
      )
    }

    // Backend expects lat/lng and specialty via query
    const lat = data.location.latitude
    const lng = data.location.longitude
    const specialty = data.specialty || "primary_care"
    const radiusKm = Math.round((data.radius ?? 25) * 1.60934)

    const url = new URL(`${API_BASE_URL}/carefinder/`)
    url.searchParams.set("lat", String(lat))
    url.searchParams.set("lng", String(lng))
    url.searchParams.set("specialty", String(specialty))
    url.searchParams.set("radius_km", String(radiusKm))
    url.searchParams.set("max_results", String(50))
    url.searchParams.set("language", "en")

    const backendRes = await fetch(url.toString())
    if (!backendRes.ok) {
      const err = await safeJson(backendRes)
      return NextResponse.json({ success: false, message: err?.detail || "Provider search failed" }, { status: backendRes.status })
    }

    const backendJson = await backendRes.json()

    // Map backend providers -> frontend Provider[]
    const providers: Provider[] = (backendJson.providers || []).map((p: any) => ({
      id: p.place_id,
      name: p.name,
      specialty: p.specialty,
      practice: p.name,
      address: p.address,
      distance: Math.round((p.distance_km ?? 0) * 10) / 10,
      rating: p.rating ?? 0,
      reviewCount: 0,
      acceptsInsurance: p.insurance_accepted || [],
      languages: ["English"],
      availability: "",
      phone: p.phone || "",
      website: undefined,
    }))

    const response: ProviderSearchResponse = {
      providers,
      totalCount: providers.length,
      searchRadius: data.radius || 25,
      location: data.location,
    }

    return NextResponse.json({ success: true, data: response, message: `Found ${providers.length} providers` })
  } catch (error) {
    console.error("Provider search error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    )
  }
}

async function safeJson(res: Response) { try { return await res.json() } catch { return undefined } } 