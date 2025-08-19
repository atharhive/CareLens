"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProviderMap } from "@/src/components/maps/provider-map"
import { useCareStore } from "@/src/stores/care-store"

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

	useEffect(() => {
		if (!userLocation && !isLocationLoading) {
			getCurrentLocation()
		}
	}, [userLocation, isLocationLoading, getCurrentLocation])

	return (
		<div className="min-h-screen bg-background py-8 px-4">
			<div className="max-w-7xl mx-auto space-y-6">
				<div className="space-y-2">
					<h1 className="text-3xl font-bold">Find Healthcare Providers</h1>
					<p className="text-muted-foreground">Search nearby providers and filter by specialty, insurance, language, and availability.</p>
				</div>

				{/* Filters */}
				<Card>
					<CardHeader>
						<CardTitle>Search Filters</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

						<div className="md:col-span-2 lg:col-span-4 flex gap-3">
							<Button onClick={() => searchNearbyProviders()} disabled={isLoadingProviders}>
								Search Nearby
							</Button>
							<Button variant="outline" onClick={clearFilters} className="bg-transparent">
								Clear Filters
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Map + List */}
				<ProviderMap providers={filteredProviders} userLocation={userLocation} className="mt-2" />

				{/* States */}
				{locationError && (
					<Card>
						<CardContent className="pt-6 text-sm text-destructive">{locationError}</CardContent>
					</Card>
				)}
				{isLoadingProviders && (
					<Card>
						<CardContent className="pt-6">Searching providers...</CardContent>
					</Card>
				)}
				{!isLoadingProviders && filteredProviders.length === 0 && (
					<Card>
						<CardContent className="pt-6 text-sm text-muted-foreground">No providers found. Try adjusting filters.</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
} 