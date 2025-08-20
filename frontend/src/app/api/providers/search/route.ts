import { type NextRequest, NextResponse } from "next/server"
import type { ProviderSearchRequest, ProviderSearchResponse } from "@/services/provider-service"
import type { Provider } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const data: ProviderSearchRequest = await request.json()

    if (!data.location) {
      return NextResponse.json(
        {
          success: false,
          message: "Location is required",
        },
        { status: 400 },
      )
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock provider data
    const mockProviders: Provider[] = [
      {
        id: "1",
        name: "Dr. Sarah Johnson",
        specialty: data.specialty || "Primary Care",
        practice: "City Medical Center",
        address: "123 Healthcare Blvd, Medical District",
        distance: 2.3,
        rating: 4.8,
        reviewCount: 127,
        acceptsInsurance: ["Blue Cross", "Aetna", "Cigna", "Medicare"],
        languages: ["English", "Spanish"],
        availability: "Next available: Tomorrow",
        phone: "(555) 123-4567",
        website: "https://citymedical.com/dr-johnson",
      },
      {
        id: "2",
        name: "Dr. Michael Chen",
        specialty: "Endocrinology",
        practice: "Diabetes & Hormone Clinic",
        address: "456 Wellness Ave, Health Plaza",
        distance: 4.7,
        rating: 4.9,
        reviewCount: 89,
        acceptsInsurance: ["Medicare", "Blue Cross", "United", "Humana"],
        languages: ["English", "Mandarin"],
        availability: "Next available: Next week",
        phone: "(555) 234-5678",
      },
      {
        id: "3",
        name: "Dr. Emily Rodriguez",
        specialty: "Cardiology",
        practice: "Heart & Vascular Institute",
        address: "789 Cardiac Way, Medical Center",
        distance: 6.1,
        rating: 4.7,
        reviewCount: 156,
        acceptsInsurance: ["Aetna", "Cigna", "Humana", "Blue Cross"],
        languages: ["English", "Spanish", "Portuguese"],
        availability: "Next available: In 2 weeks",
        phone: "(555) 345-6789",
        website: "https://heartvascular.com/dr-rodriguez",
      },
      {
        id: "4",
        name: "Dr. James Wilson",
        specialty: "Internal Medicine",
        practice: "Community Health Partners",
        address: "321 Main Street, Downtown",
        distance: 8.2,
        rating: 4.6,
        reviewCount: 203,
        acceptsInsurance: ["Medicare", "Medicaid", "Blue Cross", "Aetna"],
        languages: ["English"],
        availability: "Next available: This week",
        phone: "(555) 456-7890",
      },
      {
        id: "5",
        name: "Dr. Lisa Park",
        specialty: "Family Medicine",
        practice: "Neighborhood Family Clinic",
        address: "654 Oak Avenue, Suburban Area",
        distance: 12.5,
        rating: 4.5,
        reviewCount: 94,
        acceptsInsurance: ["Blue Cross", "United", "Cigna"],
        languages: ["English", "Korean"],
        availability: "Next available: Tomorrow",
        phone: "(555) 567-8901",
        website: "https://neighborhoodfamily.com/dr-park",
      },
    ]

    // Apply filters
    let filteredProviders = mockProviders

    if (data.specialty) {
      filteredProviders = filteredProviders.filter((p) =>
        p.specialty.toLowerCase().includes(data.specialty!.toLowerCase()),
      )
    }

    if (data.radius) {
      filteredProviders = filteredProviders.filter((p) => p.distance <= data.radius!)
    }

    if (data.insurance) {
      filteredProviders = filteredProviders.filter((p) =>
        p.acceptsInsurance.some((ins) => ins.toLowerCase().includes(data.insurance!.toLowerCase())),
      )
    }

    if (data.language) {
      filteredProviders = filteredProviders.filter((p) =>
        p.languages.some((lang) => lang.toLowerCase().includes(data.language!.toLowerCase())),
      )
    }

    // Sort results
    if (data.sortBy === "rating") {
      filteredProviders.sort((a, b) => b.rating - a.rating)
    } else if (data.sortBy === "availability") {
      // Mock availability sorting
      filteredProviders.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      // Default: sort by distance
      filteredProviders.sort((a, b) => a.distance - b.distance)
    }

    const response: ProviderSearchResponse = {
      providers: filteredProviders,
      totalCount: filteredProviders.length,
      searchRadius: data.radius || 25,
      location: data.location,
    }

    return NextResponse.json({
      success: true,
      data: response,
      message: `Found ${filteredProviders.length} providers`,
    })
  } catch (error) {
    console.error("Provider search error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
