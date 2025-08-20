"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapsService, type MapMarker } from "@/services/maps-service"
import { MapPin, Navigation, Phone } from "lucide-react"
import type { Provider, Location } from "@/types"

interface ProviderMapProps {
  providers: Provider[]
  userLocation: Location | null
  onProviderSelect?: (provider: Provider) => void
  className?: string
}

export function ProviderMap({ providers, userLocation, onProviderSelect, className }: ProviderMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    initializeMap()
  }, [userLocation])

  useEffect(() => {
    if (providers.length > 0) {
      addProviderMarkers()
    }
  }, [providers])

  const initializeMap = async () => {
    if (!mapRef.current || !userLocation) return

    setIsLoading(true)
    setMapError(null)

    try {
      const map = await MapsService.initializeMap(mapRef.current, userLocation)

      if (!map) {
        throw new Error("Failed to initialize map")
      }

      // Add user location marker
      const userMarker: MapMarker = {
        id: "user",
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        title: "Your Location",
        info: `<div class="p-2"><strong>Your Location</strong><br/>${userLocation.address}</div>`,
      }

      MapsService.addMarkers([userMarker])
      setIsLoading(false)
    } catch (error) {
      console.error("Map initialization error:", error)
      setMapError("Failed to load map. Please check your internet connection.")
      setIsLoading(false)
    }
  }

  const addProviderMarkers = () => {
    if (!userLocation) return

    const providerMarkers: MapMarker[] = providers.map((provider) => ({
      id: provider.id,
      position: {
        // Mock coordinates based on distance (in real app, providers would have actual coordinates)
        lat: userLocation.latitude + (Math.random() - 0.5) * 0.1,
        lng: userLocation.longitude + (Math.random() - 0.5) * 0.1,
      },
      title: provider.name,
      info: `
        <div class="p-3 max-w-xs">
          <h3 class="font-semibold text-lg">${provider.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${provider.specialty}</p>
          <p class="text-sm mb-2">${provider.practice}</p>
          <p class="text-sm mb-2">${provider.address}</p>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-sm font-medium">${provider.rating}</span>
            <span class="text-xs text-gray-500">(${provider.reviewCount} reviews)</span>
          </div>
          <p class="text-sm text-green-600">${provider.availability}</p>
        </div>
      `,
    }))

    // Add user location marker
    const userMarker: MapMarker = {
      id: "user",
      position: { lat: userLocation.latitude, lng: userLocation.longitude },
      title: "Your Location",
      info: `<div class="p-2"><strong>Your Location</strong><br/>${userLocation.address}</div>`,
    }

    MapsService.addMarkers([userMarker, ...providerMarkers])
  }

  const handleGetDirections = async (provider: Provider) => {
    if (!userLocation) return

    try {
      // Mock provider location
      const providerLocation: Location = {
        latitude: userLocation.latitude + (Math.random() - 0.5) * 0.1,
        longitude: userLocation.longitude + (Math.random() - 0.5) * 0.1,
        address: provider.address,
      }

      const directions = await MapsService.getDirections(userLocation, providerLocation)
      if (directions) {
        // In a real app, you would display the directions on the map
        console.log("Directions:", directions)
        // Open Google Maps with directions
        const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${providerLocation.latitude},${providerLocation.longitude}`
        window.open(url, "_blank")
      }
    } catch (error) {
      console.error("Failed to get directions:", error)
    }
  }

  if (mapError) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{mapError}</p>
            <Button onClick={initializeMap} variant="outline" className="mt-4 bg-transparent">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Provider Locations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-96 bg-muted animate-pulse rounded-md flex items-center justify-center">
                  <p className="text-muted-foreground">Loading map...</p>
                </div>
              ) : (
                <div ref={mapRef} className="h-96 w-full rounded-md" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Provider List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Nearby Providers ({providers.length})</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedProvider?.id === provider.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setSelectedProvider(provider)
                  onProviderSelect?.(provider)
                }}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm">{provider.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {provider.distance} mi
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{provider.specialty}</p>
                    <p className="text-xs text-muted-foreground">{provider.practice}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{provider.rating}</span>
                        <span className="text-xs text-muted-foreground">({provider.reviewCount})</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`tel:${provider.phone}`, "_self")
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleGetDirections(provider)
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <Navigation className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
