"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProviderMap } from "@/components/maps/provider-map"
import { ProviderCard } from "@/components/ui/custom/provider-card"
import { ProviderCardSkeleton } from "@/components/ui/custom/loading-skeleton"
import { useCareStore } from "@/stores/care-store"
import { Search, MapPin, Filter, Grid, List, Star, Phone, Globe, Clock, Shield, Navigation } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProvidersPage() {
	const {
		providers,
		filteredProviders,
		userLocation,
		isLocationLoading,
		locationError,
		isLoadingProviders,
		selectedSpecialty,
		searchRadius,
		insuranceFilter,
		languageFilter,
		availabilityFilter,
		setSelectedSpecialty,
		setSearchRadius,
		setInsuranceFilter,
		setLanguageFilter,
		setAvailabilityFilter,
		clearFilters,
		getCurrentLocation,
		searchNearbyProviders,
		searchProviders,
	} = useCareStore()

	const [viewMode, setViewMode] = useState<"map" | "list">("list")
	const [searchQuery, setSearchQuery] = useState("")
	const [showFilters, setShowFilters] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!userLocation && !isLocationLoading) {
			getCurrentLocation()
		}
	}, [userLocation, isLocationLoading, getCurrentLocation])

	const handleBookAppointment = (provider: any) => {
		// TODO: Implement booking functionality
		console.log("Book appointment for:", provider.name)
	}

	const handleGetDirections = (provider: any) => {
		// TODO: Implement directions functionality
		const address = encodeURIComponent(provider.address)
		window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, "_blank")
	}

	const handleCallProvider = (phone: string) => {
		window.open(`tel:${phone}`, "_blank")
	}

	const handleVisitWebsite = (website: string) => {
		window.open(website, "_blank")
	}

	// Prevent hydration mismatch by not rendering until mounted
	if (!mounted) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
				<div className="max-w-7xl mx-auto px-4 py-6">
					<div className="animate-pulse">
						<div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
						<div className="h-4 bg-gray-200 rounded w-1/2"></div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
			{/* Header */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 py-6">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">Find Healthcare Providers</h1>
							<p className="text-gray-600 mt-1">Search nearby providers and filter by specialty, insurance, and more.</p>
						</div>
						
						{/* View Mode Toggle */}
						<div className="flex items-center gap-2">
							<Button
								variant={viewMode === "list" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("list")}
								className="flex items-center gap-2"
							>
								<List className="h-4 w-4" />
								List
							</Button>
							<Button
								variant={viewMode === "map" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("map")}
								className="flex items-center gap-2"
							>
								<MapPin className="h-4 w-4" />
								Map
							</Button>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 py-6">
				{/* Search and Filters */}
				<Card className="mb-6 border-0 shadow-sm">
					<CardHeader className="pb-4">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex-1 max-w-md">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input
										placeholder="Search providers by name, specialty, or practice..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>
							
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setShowFilters(!showFilters)}
									className="flex items-center gap-2"
								>
									<Filter className="h-4 w-4" />
									{showFilters ? "Hide" : "Show"} Filters
								</Button>
								
								<Button
									variant="outline"
									size="sm"
									onClick={clearFilters}
									className="bg-transparent"
								>
									Clear All
								</Button>
							</div>
						</div>
					</CardHeader>

					{/* Search Button - Always Visible */}
					<CardContent className="pt-0">
						<div className="flex justify-center mb-4">
							<Button 
								onClick={() => searchNearbyProviders()} 
								disabled={isLoadingProviders}
								className="w-full sm:w-auto px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
								size="lg"
							>
								<Search className="h-5 w-5 mr-2" />
								{isLoadingProviders ? "Searching..." : "Search Nearby Providers"}
							</Button>
						</div>

						{showFilters && (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-4 border-t">
								<div className="space-y-2">
									<Label>Specialty</Label>
									<Input
										placeholder="e.g., Primary Care, Cardiology"
										value={selectedSpecialty}
										onChange={(e) => setSelectedSpecialty(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label>Insurance</Label>
									<Input
										placeholder="e.g., Blue Cross, Aetna"
										value={insuranceFilter}
										onChange={(e) => setInsuranceFilter(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label>Language</Label>
									<Input
										placeholder="e.g., Spanish, Mandarin"
										value={languageFilter}
										onChange={(e) => setLanguageFilter(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label>Availability</Label>
									<Select value={(availabilityFilter || "any")} onValueChange={(v) => setAvailabilityFilter(v === "any" ? "" : v)}>
										<SelectTrigger>
											<SelectValue placeholder="Any time" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="any">Any time</SelectItem>
											<SelectItem value="today">Today</SelectItem>
											<SelectItem value="tomorrow">Tomorrow</SelectItem>
											<SelectItem value="week">Within a week</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2 md:col-span-2 lg:col-span-4">
									<Label>Search Radius: {searchRadius} miles</Label>
									<Slider
										value={[searchRadius]}
										min={5}
										max={50}
										step={1}
										onValueChange={(v) => setSearchRadius(v[0])}
									/>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Location Status */}
				{locationError && (
					<Card className="mb-6 border-red-200 bg-red-50">
						<CardContent className="pt-6 text-sm text-red-600 flex items-center gap-2">
							<MapPin className="h-4 w-4" />
							{locationError}
						</CardContent>
					</Card>
				)}

				{isLocationLoading && (
					<Card className="mb-6">
						<CardContent className="pt-6 text-sm text-muted-foreground">
							Getting your location...
						</CardContent>
					</Card>
				)}

				{/* Content Tabs */}
				<Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "map" | "list")} className="space-y-6">
					<TabsContent value="list" className="space-y-6">
						{/* Results Header */}
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-xl font-semibold text-gray-900">
									{isLoadingProviders ? "Searching..." : `${filteredProviders.length} Providers Found`}
								</h2>
								{userLocation && (
									<p className="text-sm text-gray-600 mt-1">
										Searching near {userLocation.address}
									</p>
								)}
							</div>
							
							{filteredProviders.length > 0 && (
								<div className="flex items-center gap-2 text-sm text-gray-600">
									<Star className="h-4 w-4 text-yellow-400" />
									<span>Sort by rating</span>
								</div>
							)}
						</div>

						{/* Loading State */}
						{isLoadingProviders && (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{Array.from({ length: 6 }).map((_, i) => (
									<ProviderCardSkeleton key={i} />
								))}
							</div>
						)}

						{/* No Results */}
						{!isLoadingProviders && filteredProviders.length === 0 && (
							<Card className="text-center py-12">
								<CardContent>
									<Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
									<p className="text-gray-600 mb-4">
										Try adjusting your search filters or expanding your search radius.
									</p>
									<Button onClick={() => searchNearbyProviders()}>
										Search Again
									</Button>
								</CardContent>
							</Card>
						)}

						{/* Provider Grid */}
						{!isLoadingProviders && filteredProviders.length > 0 && (
							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{filteredProviders.map((provider) => (
									<ProviderCard
										key={provider.id}
										provider={provider}
										onBookAppointment={() => handleBookAppointment(provider)}
										onGetDirections={() => handleGetDirections(provider)}
									/>
								))}
							</div>
						)}
					</TabsContent>

					<TabsContent value="map" className="space-y-6">
						<div className="h-[600px] rounded-lg overflow-hidden border border-gray-200">
							<ProviderMap 
								providers={filteredProviders} 
								userLocation={userLocation ?? null} 
								className="h-full w-full"
							/>
						</div>
						
						{/* Map Results Summary */}
						{filteredProviders.length > 0 && (
							<Card>
								<CardContent className="pt-6">
									<div className="flex items-center justify-between">
										<div>
											<h3 className="font-medium text-gray-900">
												{filteredProviders.length} providers on map
											</h3>
											<p className="text-sm text-gray-600">
												Click on markers to see provider details
											</p>
										</div>
										<Button variant="outline" onClick={() => setViewMode("list")}>
											View as List
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
} 