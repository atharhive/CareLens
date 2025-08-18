import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { providersApi, getUserLocation } from "@/lib/api";
import ProviderCard from "@/components/providers/provider-card";
import { 
  MapPin, 
  Search, 
  Filter,
  Users,
  AlertCircle,
  Loader2,
  Navigation
} from "lucide-react";

export default function Providers() {
  const [searchParams, setSearchParams] = useState({
    latitude: 0,
    longitude: 0,
    radius: 25,
    specialty: '',
    acceptsNewPatients: true,
    language: '',
    insurance: ''
  });
  
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [manualLocation, setManualLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get user location on component mount
  useEffect(() => {
    getUserLocation()
      .then((location) => {
        setSearchParams(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude
        }));
        setLocationPermission('granted');
      })
      .catch(() => {
        setLocationPermission('denied');
      });
  }, []);

  const { data: providers, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/providers/search', searchParams],
    enabled: searchParams.latitude !== 0 && searchParams.longitude !== 0,
  });

  const handleSearch = () => {
    if (manualLocation && locationPermission === 'denied') {
      // In a real implementation, you would geocode the manual location
      // For now, we'll use default coordinates for the demo
      setSearchParams(prev => ({
        ...prev,
        latitude: 40.7128, // New York coordinates as example
        longitude: -74.0060
      }));
    }
    refetch();
  };

  const specialties = [
    'Endocrinologist',
    'Cardiologist',
    'Neurologist',
    'Nephrologist',
    'Hepatologist',
    'Gastroenterologist',
    'Hematologist',
    'Primary Care'
  ];

  const languages = [
    'English',
    'Spanish',
    'Mandarin',
    'French',
    'German',
    'Arabic',
    'Hindi'
  ];

  const insurances = [
    'BlueCross BlueShield',
    'Aetna',
    'Cigna',
    'UnitedHealthcare',
    'Medicare',
    'Medicaid',
    'Kaiser Permanente'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Users className="mr-3 h-8 w-8 text-medical-blue" />
          Find Healthcare Providers
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Discover qualified specialists based on your health risk assessment
        </p>
      </div>

      {/* Location & Search */}
      <Card className="medical-card mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5 text-healthcare-teal" />
            Location & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {locationPermission === 'denied' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter Location
                </label>
                <Input
                  placeholder="City, State or ZIP code"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                />
              </div>
            )}
            
            {locationPermission === 'granted' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Location
                </label>
                <div className="flex items-center text-sm text-green-600 dark:text-green-400">
                  <Navigation className="mr-1 h-4 w-4" />
                  Location detected
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Radius
              </label>
              <Select 
                value={searchParams.radius.toString()} 
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, radius: Number(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 miles</SelectItem>
                  <SelectItem value="10">10 miles</SelectItem>
                  <SelectItem value="25">25 miles</SelectItem>
                  <SelectItem value="50">50 miles</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Specialty
              </label>
              <Select 
                value={searchParams.specialty} 
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, specialty: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All specialties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All specialties</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty.toLowerCase()}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="medical-button medical-button-primary w-full">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showFilters ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Language
                  </label>
                  <Select 
                    value={searchParams.language} 
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any language</SelectItem>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language.toLowerCase()}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Insurance
                  </label>
                  <Select 
                    value={searchParams.insurance} 
                    onValueChange={(value) => setSearchParams(prev => ({ ...prev, insurance: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any insurance</SelectItem>
                      {insurances.map((insurance) => (
                        <SelectItem key={insurance} value={insurance.toLowerCase()}>
                          {insurance}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 mt-6">
                  <input
                    type="checkbox"
                    id="newPatients"
                    checked={searchParams.acceptsNewPatients}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, acceptsNewPatients: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="newPatients" className="text-sm text-gray-700 dark:text-gray-300">
                    Accepting new patients only
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Permission Alert */}
      {locationPermission === 'denied' && !manualLocation && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Location access denied. Please enter your location manually or enable location services for more accurate results.
          </AlertDescription>
        </Alert>
      )}

      {/* Results */}
      <div>
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
            {[...Array(3)].map((_, index) => (
              <Card key={index} className="medical-card">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                      <div className="flex space-x-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load providers. Please try again or check your location settings.
            </AlertDescription>
          </Alert>
        )}

        {providers && providers.length === 0 && !isLoading && (
          <Card className="medical-card">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Providers Found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Try expanding your search radius or adjusting your filters.
              </p>
              <Button 
                onClick={() => setSearchParams(prev => ({ ...prev, radius: prev.radius * 2 }))}
                variant="outline"
              >
                Expand Search Radius
              </Button>
            </CardContent>
          </Card>
        )}

        {providers && providers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Found {providers.length} Provider{providers.length !== 1 ? 's' : ''}
              </h2>
              <Badge variant="secondary" className="bg-medical-blue/10 text-medical-blue border-medical-blue/20">
                Within {searchParams.radius} miles
              </Badge>
            </div>
            
            <div className="space-y-4">
              {providers.map((provider, index) => (
                <ProviderCard key={provider.id || index} provider={provider} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
