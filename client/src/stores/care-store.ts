import { create } from "zustand"
import type { Provider, Location } from "@/src/types"

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
  userLocation: Location | null
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
  setUserLocation: (location: Location | null) => void
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
  userLocation: null,
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
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock provider data
      const mockProviders: Provider[] = [
        {
          id: "1",
          name: "Dr. Sarah Johnson",
          specialty: specialty || "Primary Care",
          practice: "City Medical Center",
          address: "123 Healthcare Blvd, Medical District",
          distance: 2.3,
          rating: 4.8,
          reviewCount: 127,
          acceptsInsurance: ["Blue Cross", "Aetna", "Cigna"],
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
          acceptsInsurance: ["Medicare", "Blue Cross", "United"],
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
          acceptsInsurance: ["Aetna", "Cigna", "Humana"],
          languages: ["English", "Spanish", "Portuguese"],
          availability: "Next available: In 2 weeks",
          phone: "(555) 345-6789",
          website: "https://heartvascular.com/dr-rodriguez",
        },
      ]

      set({
        providers: mockProviders,
        filteredProviders: mockProviders,
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
      userLocation: null,
      isLocationLoading: false,
      locationError: null,
      isLoadingProviders: false,
      providersError: null,
    }),
}))
