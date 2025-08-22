import { create } from "zustand"
import type { Provider, Location } from "@/types"

interface CareState {
  // Provider data
  providers: Provider[]
  filteredProviders: Provider[]
  selectedProvider: Provider | null

  // Search filters
  selectedSpecialty: string
  searchRadius: number
  insuranceFilter: string
  languageFilter: string
  availabilityFilter: string

  // Location
  userLocation: Location | undefined
  isLocationLoading: boolean
  locationError: string | null

  // Loading states
  isLoadingProviders: boolean
  providersError: string | null

  // Actions
  setProviders: (providers: Provider[]) => void
  setSelectedProvider: (provider: Provider | null) => void

  // Filter actions
  setSelectedSpecialty: (specialty: string) => void
  setSearchRadius: (radius: number) => void
  setInsuranceFilter: (insurance: string) => void
  setLanguageFilter: (language: string) => void
  setAvailabilityFilter: (availability: string) => void
  applyFilters: () => void
  clearFilters: () => void

  // Location actions
  setUserLocation: (location: Location | undefined) => void
  setLocationLoading: (loading: boolean) => void
  setLocationError: (error: string | null) => void
  getCurrentLocation: () => Promise<void>

  // Provider search actions
  searchProviders: (specialty?: string, location?: Location) => Promise<void>
  searchNearbyProviders: (radius?: number) => Promise<void>

  // Reset
  resetCareStore: () => void
}

export const useCareStore = create<CareState>((set, get) => ({
  // Initial state
  providers: [],
  filteredProviders: [],
  selectedProvider: null,
  selectedSpecialty: "",
  searchRadius: 25, // miles
  insuranceFilter: "",
  languageFilter: "",
  availabilityFilter: "",
  userLocation: undefined,
  isLocationLoading: false,
  locationError: null,
  isLoadingProviders: false,
  providersError: null,

  // Provider actions
  setProviders: (providers) => {
    set({ providers, filteredProviders: providers })
    get().applyFilters()
  },
  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  // Filter actions
  setSelectedSpecialty: (specialty) => {
    set({ selectedSpecialty: specialty })
    get().applyFilters()
  },
  setSearchRadius: (radius) => {
    set({ searchRadius: radius })
    get().applyFilters()
  },
  setInsuranceFilter: (insurance) => {
    set({ insuranceFilter: insurance })
    get().applyFilters()
  },
  setLanguageFilter: (language) => {
    set({ languageFilter: language })
    get().applyFilters()
  },
  setAvailabilityFilter: (availability) => {
    set({ availabilityFilter: availability })
    get().applyFilters()
  },

  applyFilters: () => {
    const { providers, selectedSpecialty, searchRadius, insuranceFilter, languageFilter, availabilityFilter } = get()

    let filtered = [...providers]

    // Filter by specialty
    if (selectedSpecialty) {
      filtered = filtered.filter((provider) =>
        provider.specialty.toLowerCase().includes(selectedSpecialty.toLowerCase()),
      )
    }

    // Filter by distance
    filtered = filtered.filter((provider) => provider.distance <= searchRadius)

    // Filter by insurance
    if (insuranceFilter) {
      filtered = filtered.filter((provider) =>
        provider.acceptsInsurance.some((insurance) => insurance.toLowerCase().includes(insuranceFilter.toLowerCase())),
      )
    }

    // Filter by language
    if (languageFilter) {
      filtered = filtered.filter((provider) =>
        provider.languages.some((language) => language.toLowerCase().includes(languageFilter.toLowerCase())),
      )
    }

    // Filter by availability
    if (availabilityFilter) {
      filtered = filtered.filter((provider) =>
        provider.availability.toLowerCase().includes(availabilityFilter.toLowerCase()),
      )
    }

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance)

    set({ filteredProviders: filtered })
  },

  clearFilters: () => {
    set({
      selectedSpecialty: "",
      insuranceFilter: "",
      languageFilter: "",
      availabilityFilter: "",
      filteredProviders: get().providers,
    })
  },

  // Location actions
  setUserLocation: (location) => set({ userLocation: location }),
  setLocationLoading: (loading) => set({ isLocationLoading: loading }),
  setLocationError: (error) => set({ locationError: error }),

  getCurrentLocation: async () => {
    set({ isLocationLoading: true, locationError: null })

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser")
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        })
      })

      // Simulate reverse geocoding
      const mockAddress = "123 Main St, Anytown, ST 12345"

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: mockAddress,
      }

      set({
        userLocation: location,
        isLocationLoading: false,
      })
    } catch (error) {
      set({
        locationError: error instanceof Error ? error.message : "Failed to get location",
        isLocationLoading: false,
      })
    }
  },

  // Provider search actions
  searchProviders: async (specialty, location) => {
    set({ isLoadingProviders: true, providersError: null })

    try {
      if (!location) {
        throw new Error("Location is required for provider search")
      }

      // Build query parameters for the backend API
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
        specialty: specialty || "primary_care",
        radius_km: Math.round((get().searchRadius || 25) * 1.60934).toString(), // Convert miles to km
        max_results: "50",
        language: "en"
      })

      // Call the backend API directly
      const response = await fetch(`http://localhost:5000/carefinder/?${params.toString()}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        mode: "cors",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Failed to search providers")
      }

      const data = await response.json()
      
      // Transform backend response to frontend format
      const providers = (data.providers || []).map((p: any) => ({
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

      set({
        providers,
        filteredProviders: providers,
        isLoadingProviders: false,
      })
      get().applyFilters()
    } catch (error) {
      set({
        providersError: error instanceof Error ? error.message : "Failed to search providers",
        isLoadingProviders: false,
      })
    }
  },

  searchNearbyProviders: async (radius) => {
    const { userLocation } = get()
    if (!userLocation) {
      await get().getCurrentLocation()
    }

    if (radius) {
      set({ searchRadius: radius })
    }

    await get().searchProviders(get().selectedSpecialty, get().userLocation)
  },

  // Reset action
  resetCareStore: () =>
    set({
      providers: [],
      filteredProviders: [],
      selectedProvider: null,
      selectedSpecialty: "",
      searchRadius: 25,
      insuranceFilter: "",
      languageFilter: "",
      availabilityFilter: "",
      userLocation: undefined,
      isLocationLoading: false,
      locationError: null,
      isLoadingProviders: false,
      providersError: null,
    }),
}))
