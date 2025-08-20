import { apiRequest, ApiError } from "@/lib/api-client"
import type { Provider, Location } from "@/types"

export interface ProviderSearchRequest {
  location: Location
  specialty?: string
  radius?: number // miles
  insurance?: string
  language?: string
  availability?: string
  sortBy?: "distance" | "rating" | "availability"
}

export interface ProviderSearchResponse {
  providers: Provider[]
  totalCount: number
  searchRadius: number
  location: Location
}

export class ProviderService {
  // Search for healthcare providers
  static async searchProviders(request: ProviderSearchRequest): Promise<ProviderSearchResponse> {
    try {
      const response = await apiRequest<ProviderSearchResponse>({
        method: "POST",
        url: "/providers/search",
        data: request,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 400:
            throw new ApiError(
              "Invalid search parameters. Please check your location and filters.",
              400,
              "INVALID_SEARCH",
            )
          case 404:
            throw new ApiError(
              "No providers found in your area. Try expanding your search radius.",
              404,
              "NO_PROVIDERS",
            )
          default:
            throw new ApiError("Failed to search providers. Please try again.", error.status, error.code)
        }
      }
      throw error
    }
  }

  // Get provider details
  static async getProviderDetails(providerId: string): Promise<Provider> {
    try {
      const response = await apiRequest<Provider>({
        method: "GET",
        url: `/providers/${providerId}`,
      })

      return response
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError("Provider not found.", 404, "PROVIDER_NOT_FOUND")
      }
      throw error
    }
  }

  // Get recommended providers based on assessment
  static async getRecommendedProviders(assessmentId: string, location: Location): Promise<Provider[]> {
    try {
      const response = await apiRequest<Provider[]>({
        method: "POST",
        url: "/providers/recommendations",
        data: {
          assessmentId,
          location,
        },
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            throw new ApiError("Assessment not found.", 404, "ASSESSMENT_NOT_FOUND")
          default:
            throw new ApiError("Failed to get provider recommendations.", error.status, error.code)
        }
      }
      throw error
    }
  }

  // Geocode address to coordinates
  static async geocodeAddress(address: string): Promise<Location> {
    try {
      const response = await apiRequest<Location>({
        method: "POST",
        url: "/location/geocode",
        data: { address },
      })

      return response
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.status) {
          case 404:
            throw new ApiError("Address not found. Please check the address and try again.", 404, "ADDRESS_NOT_FOUND")
          default:
            throw new ApiError("Failed to find location. Please try again.", error.status, error.code)
        }
      }
      throw error
    }
  }
}
