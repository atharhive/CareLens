"use client"

import type { Location } from "@/src/types"

// Google Maps configuration
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

export interface MapMarker {
  id: string
  position: { lat: number; lng: number }
  title: string
  info?: string
}

export class MapsService {
  private static mapInstance: google.maps.Map | null = null
  private static markers: google.maps.Marker[] = []

  // Initialize Google Maps
  static async initializeMap(container: HTMLElement, center: Location, zoom = 12): Promise<google.maps.Map | null> {
    try {
      // Load Google Maps API if not already loaded
      if (!window.google) {
        await this.loadGoogleMapsAPI()
      }

      const map = new google.maps.Map(container, {
        center: { lat: center.latitude, lng: center.longitude },
        zoom,
        styles: [
          {
            featureType: "poi.medical",
            elementType: "geometry",
            stylers: [{ color: "#059669" }],
          },
        ],
      })

      this.mapInstance = map
      return map
    } catch (error) {
      console.error("Failed to initialize Google Maps:", error)
      return null
    }
  }

  // Load Google Maps API dynamically
  private static loadGoogleMapsAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
      script.async = true
      script.defer = true

      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google Maps API"))

      document.head.appendChild(script)
    })
  }

  // Add markers to map
  static addMarkers(markers: MapMarker[]): void {
    if (!this.mapInstance) return

    // Clear existing markers
    this.clearMarkers()

    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: markerData.position,
        map: this.mapInstance,
        title: markerData.title,
        icon: {
          url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#059669"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
      })

      if (markerData.info) {
        const infoWindow = new google.maps.InfoWindow({
          content: markerData.info,
        })

        marker.addListener("click", () => {
          infoWindow.open(this.mapInstance, marker)
        })
      }

      this.markers.push(marker)
    })
  }

  // Clear all markers
  static clearMarkers(): void {
    this.markers.forEach((marker) => marker.setMap(null))
    this.markers = []
  }

  // Get directions between two points
  static async getDirections(origin: Location, destination: Location): Promise<google.maps.DirectionsResult | null> {
    try {
      if (!window.google) {
        await this.loadGoogleMapsAPI()
      }

      const directionsService = new google.maps.DirectionsService()

      return new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: { lat: origin.latitude, lng: origin.longitude },
            destination: { lat: destination.latitude, lng: destination.longitude },
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve(result)
            } else {
              reject(new Error(`Directions request failed: ${status}`))
            }
          },
        )
      })
    } catch (error) {
      console.error("Failed to get directions:", error)
      return null
    }
  }

  // Geocode address to coordinates
  static async geocodeAddress(address: string): Promise<Location | null> {
    try {
      if (!window.google) {
        await this.loadGoogleMapsAPI()
      }

      const geocoder = new google.maps.Geocoder()

      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location
            resolve({
              latitude: location.lat(),
              longitude: location.lng(),
              address: results[0].formatted_address,
            })
          } else {
            reject(new Error(`Geocoding failed: ${status}`))
          }
        })
      })
    } catch (error) {
      console.error("Failed to geocode address:", error)
      return null
    }
  }
}

// Extend Window interface for Google Maps
declare global {
  interface Window {
    google: typeof google
  }
}
