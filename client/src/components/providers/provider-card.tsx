import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  Star, 
  CheckCircle,
  Languages,
  CreditCard,
  Navigation,
  ExternalLink
} from "lucide-react";

interface Provider {
  id?: string;
  name: string;
  specialty: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  acceptsNewPatients?: boolean;
  languages?: string[];
  insuranceAccepted?: string[];
  distance?: number;
  hours?: string;
}

interface ProviderCardProps {
  provider: Provider;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const handleCall = () => {
    if (provider.phone) {
      window.location.href = `tel:${provider.phone}`;
    }
  };

  const handleWebsite = () => {
    if (provider.website) {
      window.open(provider.website.startsWith('http') ? provider.website : `https://${provider.website}`, '_blank');
    }
  };

  const handleDirections = () => {
    const encodedAddress = encodeURIComponent(provider.address);
    window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
  };

  return (
    <Card className="medical-card hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Provider Avatar/Icon */}
          <div className="w-16 h-16 bg-medical-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-medical-blue">
              {provider.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </span>
          </div>

          {/* Provider Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {provider.name}
                </h3>
                <p className="text-healthcare-teal font-medium">
                  {provider.specialty}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                {provider.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                      {provider.rating}/5.0
                    </span>
                  </div>
                )}
                {provider.acceptsNewPatients && (
                  <Badge className="bg-medical-green/10 text-medical-green border-medical-green/20">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    New Patients
                  </Badge>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start mb-3">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {provider.address}
                </p>
                {provider.distance && (
                  <p className="text-xs text-gray-500 mt-1">
                    {provider.distance} miles from you
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {provider.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatPhone(provider.phone)}
                  </span>
                </div>
              )}

              {provider.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {provider.website.replace(/^https?:\/\//, '')}
                  </span>
                </div>
              )}

              {provider.hours && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {provider.hours}
                  </span>
                </div>
              )}
            </div>

            {/* Languages & Insurance */}
            <div className="space-y-2 mb-4">
              {provider.languages && provider.languages.length > 0 && (
                <div className="flex items-center">
                  <Languages className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="flex flex-wrap gap-1">
                    {provider.languages.slice(0, 3).map((language, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {language}
                      </Badge>
                    ))}
                    {provider.languages.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{provider.languages.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {provider.insuranceAccepted && provider.insuranceAccepted.length > 0 && (
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gray-500 mr-2" />
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Accepts: {provider.insuranceAccepted.slice(0, 2).join(', ')}
                      {provider.insuranceAccepted.length > 2 && ` +${provider.insuranceAccepted.length - 2} more`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {provider.phone && (
                <Button size="sm" onClick={handleCall} className="medical-button medical-button-primary">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </Button>
              )}

              {provider.website && (
                <Button size="sm" variant="outline" onClick={handleWebsite}>
                  <Globe className="mr-2 h-4 w-4" />
                  Website
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}

              <Button size="sm" variant="outline" onClick={handleDirections}>
                <Navigation className="mr-2 h-4 w-4" />
                Directions
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
