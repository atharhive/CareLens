"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Phone, Globe, Clock, Shield } from "lucide-react"
import { cn } from "@/src/lib/utils"
import type { Provider } from "@/src/types"

interface ProviderCardProps {
  provider: Provider
  onBookAppointment?: () => void
  onGetDirections?: () => void
  className?: string
}

export function ProviderCard({ provider, onBookAppointment, onGetDirections, className }: ProviderCardProps) {
  return (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{provider.name}</CardTitle>
            <Badge variant="secondary" className="w-fit">
              {provider.specialty}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{provider.rating}</span>
            <span className="text-xs text-muted-foreground">({provider.reviewCount})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Practice Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">{provider.practice}</h4>
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p>{provider.address}</p>
              <p className="font-medium text-foreground">{provider.distance} miles away</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{provider.phone}</span>
          </div>
          {provider.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={provider.website}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-green-600 font-medium">{provider.availability}</span>
        </div>

        {/* Insurance & Languages */}
        <div className="space-y-2">
          {provider.acceptsInsurance.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Insurance:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {provider.acceptsInsurance.slice(0, 3).map((insurance) => (
                  <Badge key={insurance} variant="outline" className="text-xs">
                    {insurance}
                  </Badge>
                ))}
                {provider.acceptsInsurance.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{provider.acceptsInsurance.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {provider.languages.length > 1 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Languages:</span> {provider.languages.join(", ")}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button onClick={onBookAppointment} className="flex-1">
            Book Appointment
          </Button>
          <Button variant="outline" onClick={onGetDirections}>
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
