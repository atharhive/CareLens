"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useResultsStore } from "@/stores/results-store"
import { useIntakeStore } from "@/stores/intake-store"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import type { ShareSettings as ShareSettingsType } from "@/types"
import {
	ArrowLeft,
	Share2,
	Copy,
	Download,
	Mail,
	Link,
	Eye,
	EyeOff,
	Calendar,
	Clock,
	Shield,
	Lock
} from "lucide-react"

interface ShareSettingsUi {
	expiresIn: string
	accessLevel: "view" | "full"
	password: string
	allowedEmails: string[]
	includePersonalInfo: boolean
	includeLabData: boolean
	includeRecommendations: boolean
}

export default function SharePage() {
	const router = useRouter()
	const { detectionResults, triageResult, shareUrl, generateShareLink, isSharing } = useResultsStore()
	const { demographics } = useIntakeStore()
	
	const [shareSettings, setShareSettings] = useState<ShareSettingsUi>({
		expiresIn: "7", // days
		accessLevel: "view",
		password: "",
		allowedEmails: [],
		includePersonalInfo: false,
		includeLabData: true,
		includeRecommendations: true
	})
	
	const [newEmail, setNewEmail] = useState("")
	const [showPassword, setShowPassword] = useState(false)

	const handleGenerateLink = async () => {
		try {
			const days = parseInt(shareSettings.expiresIn)
			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(days) ? days : 7))
			const payload: Omit<ShareSettingsType, "id"> = {
				expiresAt,
				accessLevel: shareSettings.accessLevel,
				password: shareSettings.password || undefined,
				allowedEmails: shareSettings.allowedEmails.length > 0 ? shareSettings.allowedEmails : undefined,
			}
			await generateShareLink(payload)
		} catch (error) {
			console.error("Failed to generate share link:", error)
		}
	}

	const handleCopyLink = async () => {
		if (shareUrl) {
			try {
				await navigator.clipboard.writeText(shareUrl)
				// TODO: Show toast notification
			} catch (error) {
				console.error("Failed to copy link:", error)
			}
		}
	}

	const handleAddEmail = () => {
		if (newEmail && !shareSettings.allowedEmails.includes(newEmail)) {
			setShareSettings((prev: ShareSettingsUi) => ({
				...prev,
				allowedEmails: [...prev.allowedEmails, newEmail]
			}))
			setNewEmail("")
		}
	}

	const handleRemoveEmail = (email: string) => {
		setShareSettings((prev: ShareSettingsUi) => ({
			...prev,
			allowedEmails: prev.allowedEmails.filter((e) => e !== email)
		}))
	}

	if (!detectionResults) {
		return (
			<div className="min-h-screen bg-background py-8 px-4">
				<div className="max-w-4xl mx-auto text-center space-y-4">
					<h2 className="text-xl font-semibold">No Results to Share</h2>
					<p className="text-muted-foreground">Complete an assessment first to share your results.</p>
					<Button onClick={() => router.push("/assessment")}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Start Assessment
					</Button>
				</div>
			</div>
		)
	}

	const highRiskConditions = (Object.entries(detectionResults) as [string, any][]).filter(([_, result]) =>
		result.category === "high" || result.category === "critical"
	)

	return (
		<div className="min-h-screen bg-background py-8 px-4">
			<div className="max-w-4xl mx-auto space-y-8">
				{/* Header */}
				<div className="text-center space-y-4">
					<h1 className="text-3xl font-bold">Share Your Results</h1>
					<p className="text-lg text-muted-foreground">
						Securely share your health assessment results with healthcare providers or family members
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{/* Share Settings */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Share2 className="h-5 w-5" />
								Share Settings
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							{/* Expiration */}
							<div className="space-y-2">
								<Label htmlFor="expiresIn">Link Expires In</Label>
								<div className="flex items-center gap-2">
									<Input
										id="expiresIn"
										type="number"
										min="1"
										max="30"
										value={shareSettings.expiresIn}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareSettings((prev: ShareSettingsUi) => ({ ...prev, expiresIn: e.target.value }))}
										className="w-20"
									/>
									<span className="text-sm text-muted-foreground">days</span>
								</div>
							</div>

							{/* Access Level */}
							<div className="space-y-2">
								<Label>Access Level</Label>
								<ToggleGroup
									type="single"
									value={shareSettings.accessLevel}
									onValueChange={(value: "view" | "full") => value && setShareSettings((prev: ShareSettingsUi) => ({ ...prev, accessLevel: value }))}
									className="grid grid-cols-2 gap-3"
								>
									<ToggleGroupItem value="view" className="data-[state=on]:bg-blue-600 data-[state=on]:text-white">
										View Only
									</ToggleGroupItem>
									<ToggleGroupItem value="full" className="data-[state=on]:bg-blue-600 data-[state=on]:text-white">
										Full Access
									</ToggleGroupItem>
								</ToggleGroup>
							</div>

							{/* Password Protection */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="password" className="flex items-center gap-2">
										<Lock className="h-4 w-4" /> Password Protection
									</Label>
									<Switch
										id="password"
										checked={!!shareSettings.password}
										onCheckedChange={(checked: boolean) => setShareSettings((prev: ShareSettingsUi) => ({
											...prev,
											password: checked ? (prev.password || "") : ""
										}))}
									/>
								</div>
								<p className="text-xs text-muted-foreground">Protect access to your shared results with a password.</p>
								{shareSettings.password !== "" && (
									<div className="relative">
										<Input
											type={showPassword ? "text" : "password"}
											placeholder="Enter password"
											value={shareSettings.password}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShareSettings((prev: ShareSettingsUi) => ({ ...prev, password: e.target.value }))}
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3"
											onClick={() => setShowPassword(!showPassword)}
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</Button>
									</div>
								)}
							</div>

							{/* Email Restrictions */}
							<div className="space-y-2">
								<Label>Restrict to Specific Emails (Optional)</Label>
								<div className="flex gap-2">
									<Input
										type="email"
										placeholder="Enter email address"
										value={newEmail}
										onChange={(e) => setNewEmail(e.target.value)}
										onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
									/>
									<Button type="button" onClick={handleAddEmail} size="sm">
										Add
									</Button>
								</div>
								{shareSettings.allowedEmails.length > 0 && (
									<div className="space-y-2">
										{shareSettings.allowedEmails.map((email) => (
											<div key={email} className="flex items-center justify-between p-2 bg-muted rounded">
												<span className="text-sm">{email}</span>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => handleRemoveEmail(email)}
												>
													×
												</Button>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Content Options */}
							<div className="space-y-4">
								<Label>Include in Share</Label>
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label htmlFor="personalInfo" className="text-sm">Personal Information</Label>
										<Toggle
											pressed={shareSettings.includePersonalInfo}
											onPressedChange={(pressed: boolean) => setShareSettings((prev: ShareSettingsUi) => ({
												...prev,
												includePersonalInfo: pressed
											}))}
											className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
										>
											{shareSettings.includePersonalInfo ? "Include" : "Exclude"}
										</Toggle>
									</div>
									<p className="text-xs text-muted-foreground">Include your name, age, and sex in the shared view.</p>
									<div className="flex items-center justify-between">
										<Label htmlFor="labData" className="text-sm">Lab Results</Label>
										<Toggle
											pressed={shareSettings.includeLabData}
											onPressedChange={(pressed: boolean) => setShareSettings((prev: ShareSettingsUi) => ({
												...prev,
												includeLabData: pressed
											}))}
											className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
										>
											{shareSettings.includeLabData ? "Include" : "Exclude"}
										</Toggle>
									</div>
									<p className="text-xs text-muted-foreground">Include lab or document-derived findings you've uploaded.</p>
									<div className="flex items-center justify-between">
										<Label htmlFor="recommendations" className="text-sm">Recommendations</Label>
										<Toggle
											pressed={shareSettings.includeRecommendations}
											onPressedChange={(pressed: boolean) => setShareSettings((prev: ShareSettingsUi) => ({
												...prev,
												includeRecommendations: pressed
											}))}
											className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
										>
											{shareSettings.includeRecommendations ? "Include" : "Exclude"}
										</Toggle>
									</div>
									<p className="text-xs text-muted-foreground">Include your personalized next steps and lifestyle guidance.</p>
								</div>
							</div>

							<Button
								onClick={handleGenerateLink}
								disabled={isSharing}
								className="w-full"
							>
								{isSharing ? "Generating..." : "Generate Share Link"}
							</Button>
						</CardContent>
					</Card>

					{/* Generated Link */}
					<div className="space-y-6">
						{shareUrl && (
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<Link className="h-5 w-5" />
										Share Link Generated
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="space-y-2">
										<Label>Share this link with others:</Label>
										<div className="flex gap-2">
											<Input value={shareUrl} readOnly />
											<Button onClick={handleCopyLink} size="sm">
												<Copy className="h-4 w-4" />
											</Button>
										</div>
									</div>
									
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Calendar className="h-4 w-4" />
										<span>Expires in {shareSettings.expiresIn} days</span>
									</div>
									
									{shareSettings.password && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Shield className="h-4 w-4" />
											<span>Password protected</span>
										</div>
									)}
								</CardContent>
							</Card>
						)}

						{/* Summary */}
						<Card>
							<CardHeader>
								<CardTitle>What Will Be Shared</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<h4 className="font-medium">Risk Assessment Summary</h4>
									<div className="flex flex-wrap gap-2">
										{(Object.entries(detectionResults) as [string, any][]).map(([condition, result]) => (
											<Badge 
												key={condition} 
												variant={result.category === "high" || result.category === "critical" ? "destructive" : "secondary"}
											>
												{condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: 
												{Math.round(result.score * 100)}%
											</Badge>
										))}
									</div>
								</div>

								{highRiskConditions.length > 0 && (
									<div className="space-y-2">
										<h4 className="font-medium text-red-600">High Risk Conditions</h4>
										<div className="flex flex-wrap gap-2">
											{highRiskConditions.map(([condition, result]) => (
												<Badge key={condition} variant="destructive">
													{condition.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
												</Badge>
											))}
										</div>
									</div>
								)}

								{triageResult && (
									<div className="space-y-2">
										<h4 className="font-medium">Triage Level</h4>
										<Badge variant={
											triageResult.urgency === "red" ? "destructive" : 
											triageResult.urgency === "amber" ? "secondary" : "default"
										}>
											{triageResult.urgency.toUpperCase()} - {triageResult.timeframe}
										</Badge>
									</div>
								)}

								<Separator />

								<div className="text-sm text-muted-foreground space-y-1">
									<p>• {shareSettings.includePersonalInfo ? "Personal information included" : "Personal information excluded"}</p>
									<p>• {shareSettings.includeLabData ? "Lab results included" : "Lab results excluded"}</p>
									<p>• {shareSettings.includeRecommendations ? "Recommendations included" : "Recommendations excluded"}</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Navigation */}
				<div className="flex justify-between">
					<Button 
						variant="outline" 
						onClick={() => router.push("/results")}
						className="flex items-center gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Results
					</Button>
					
					<Button 
						onClick={() => router.push("/providers")}
						className="flex items-center gap-2"
					>
						Find Healthcare Providers
						<Mail className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	)
} 