"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIntakeStore } from "@/stores/intake-store"
import { Plus, X, CheckCircle2 } from "lucide-react"

const COMMON_CONDITIONS = [
	"Diabetes (Type 1 or 2)",
	"High Blood Pressure",
	"High Cholesterol",
	"Heart Disease",
	"Stroke",
	"Kidney Disease",
	"Liver Disease",
	"Thyroid Disorders",
	"Asthma",
	"COPD",
	"Cancer",
	"Arthritis",
	"Depression",
	"Anxiety",
	"Sleep Apnea",
]

const COMMON_MEDICATIONS = [
	"Blood pressure medications",
	"Cholesterol medications (statins)",
	"Diabetes medications",
	"Blood thinners",
	"Heart medications",
	"Thyroid medications",
	"Antidepressants",
	"Pain medications",
	"Vitamins/Supplements",
]

const FAMILY_CONDITIONS = [
	"Heart Disease",
	"Diabetes",
	"High Blood Pressure",
	"Stroke",
	"Cancer",
	"Kidney Disease",
	"Alzheimer's Disease",
	"Mental Health Disorders",
]

export function MedicalHistoryForm() {
	const { medicalHistory, setMedicalHistory } = useIntakeStore()
	const [newCondition, setNewCondition] = useState("")
	const [newMedication, setNewMedication] = useState("")
	const [newAllergy, setNewAllergy] = useState("")

	const handleConditionToggle = (condition: string) => {
		const conditions = medicalHistory.conditions.includes(condition)
			? medicalHistory.conditions.filter((c) => c !== condition)
			: [...medicalHistory.conditions, condition]

		setMedicalHistory({ conditions })
	}

	const handleMedicationToggle = (medication: string) => {
		const medications = medicalHistory.medications.includes(medication)
			? medicalHistory.medications.filter((m) => m !== medication)
			: [...medicalHistory.medications, medication]

		setMedicalHistory({ medications })
	}

	const handleFamilyHistoryToggle = (condition: string) => {
		const familyHistory = medicalHistory.familyHistory.includes(condition)
			? medicalHistory.familyHistory.filter((c) => c !== condition)
			: [...medicalHistory.familyHistory, condition]

		setMedicalHistory({ familyHistory })
	}

	const addCustomCondition = () => {
		if (newCondition.trim() && !medicalHistory.conditions.includes(newCondition.trim())) {
			setMedicalHistory({
				conditions: [...medicalHistory.conditions, newCondition.trim()],
			})
			setNewCondition("")
		}
	}

	const addCustomMedication = () => {
		if (newMedication.trim() && !medicalHistory.medications.includes(newMedication.trim())) {
			setMedicalHistory({
				medications: [...medicalHistory.medications, newMedication.trim()],
			})
			setNewMedication("")
		}
	}

	const addAllergy = () => {
		if (newAllergy.trim() && !medicalHistory.allergies.includes(newAllergy.trim())) {
			setMedicalHistory({
				allergies: [...medicalHistory.allergies, newAllergy.trim()],
			})
			setNewAllergy("")
		}
	}

	const removeItem = (category: keyof typeof medicalHistory, item: string) => {
		const updated = (medicalHistory[category] as string[]).filter((i) => i !== item)
		setMedicalHistory({ [category]: updated })
	}

	return (
		<div className="space-y-6">
			{/* Medical Conditions */}
			<Card>
				<CardHeader>
					<CardTitle>Medical Conditions</CardTitle>
					<CardDescription>Select any medical conditions you have been diagnosed with</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid md:grid-cols-2 gap-3">
						{COMMON_CONDITIONS.map((condition) => {
							const selected = medicalHistory.conditions.includes(condition)
							return (
								<div
									key={condition}
									className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${selected ? "border-blue-300 bg-blue-50" : "hover:bg-muted/50"}`}
									onClick={() => handleConditionToggle(condition)}
								>
									<Checkbox
										id={`condition-${condition}`}
										checked={selected}
										onCheckedChange={() => handleConditionToggle(condition)}
										className="h-5 w-5"
									/>
									<Label htmlFor={`condition-${condition}`} className="text-sm flex-1">
										{condition}
									</Label>
									{selected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
								</div>
							)
						})}
					</div>

					{/* Add custom condition */}
					<div className="flex gap-2">
						<Input
							placeholder="Add other condition..."
							value={newCondition}
							onChange={(e) => setNewCondition(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && addCustomCondition()}
						/>
						<Button onClick={addCustomCondition} size="sm">
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					{/* Selected conditions */}
					{medicalHistory.conditions.length > 0 && (
						<div className="space-y-2">
							<Label className="text-sm font-medium">Selected conditions:</Label>
							<div className="flex flex-wrap gap-2">
								{medicalHistory.conditions.map((condition) => (
									<Badge key={condition} variant="secondary" className="cursor-pointer">
										{condition}
										<X className="h-3 w-3 ml-1" onClick={() => removeItem("conditions", condition)} />
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Current Medications */}
			<Card>
				<CardHeader>
					<CardTitle>Current Medications</CardTitle>
					<CardDescription>Include prescription medications, over-the-counter drugs, and supplements</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid md:grid-cols-2 gap-3">
						{COMMON_MEDICATIONS.map((medication) => {
							const selected = medicalHistory.medications.includes(medication)
							return (
								<div
									key={medication}
									className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${selected ? "border-blue-300 bg-blue-50" : "hover:bg-muted/50"}`}
									onClick={() => handleMedicationToggle(medication)}
								>
									<Checkbox
										id={`medication-${medication}`}
										checked={selected}
										onCheckedChange={() => handleMedicationToggle(medication)}
										className="h-5 w-5"
									/>
									<Label htmlFor={`medication-${medication}`} className="text-sm flex-1">
										{medication}
									</Label>
									{selected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
								</div>
							)
						})}
					</div>

					{/* Add custom medication */}
					<div className="flex gap-2">
						<Input
							placeholder="Add other medication..."
							value={newMedication}
							onChange={(e) => setNewMedication(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && addCustomMedication()}
						/>
						<Button onClick={addCustomMedication} size="sm">
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					{/* Selected medications */}
					{medicalHistory.medications.length > 0 && (
						<div className="space-y-2">
							<Label className="text-sm font-medium">Current medications:</Label>
							<div className="flex flex-wrap gap-2">
								{medicalHistory.medications.map((medication) => (
									<Badge key={medication} variant="secondary" className="cursor-pointer">
										{medication}
										<X className="h-3 w-3 ml-1" onClick={() => removeItem("medications", medication)} />
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Family History */}
			<Card>
				<CardHeader>
					<CardTitle>Family History</CardTitle>
					<CardDescription>
						Select conditions that run in your immediate family (parents, siblings, children)
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid md:grid-cols-2 gap-3">
						{FAMILY_CONDITIONS.map((condition) => {
							const selected = medicalHistory.familyHistory.includes(condition)
							return (
								<div
									key={condition}
									className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${selected ? "border-blue-300 bg-blue-50" : "hover:bg-muted/50"}`}
									onClick={() => handleFamilyHistoryToggle(condition)}
								>
									<Checkbox
										id={`family-${condition}`}
										checked={selected}
										onCheckedChange={() => handleFamilyHistoryToggle(condition)}
										className="h-5 w-5"
									/>
									<Label htmlFor={`family-${condition}`} className="text-sm flex-1">
										{condition}
									</Label>
									{selected && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
								</div>
							)
						})}
					</div>

					{/* Selected family history */}
					{medicalHistory.familyHistory.length > 0 && (
						<div className="space-y-2">
							<Label className="text-sm font-medium">Family history:</Label>
							<div className="flex flex-wrap gap-2">
								{medicalHistory.familyHistory.map((condition) => (
									<Badge key={condition} variant="outline">
										{condition}
										<X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeItem("familyHistory", condition)} />
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Allergies */}
			<Card>
				<CardHeader>
					<CardTitle>Allergies</CardTitle>
					<CardDescription>List any known allergies to medications, foods, or other substances</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex gap-2">
						<Input
							placeholder="e.g., Penicillin, Peanuts, Latex..."
							value={newAllergy}
							onChange={(e) => setNewAllergy(e.target.value)}
							onKeyPress={(e) => e.key === "Enter" && addAllergy()}
						/>
						<Button onClick={addAllergy} size="sm">
							<Plus className="h-4 w-4" />
						</Button>
					</div>

					{/* Selected allergies */}
					{medicalHistory.allergies.length > 0 && (
						<div className="space-y-2">
							<Label className="text-sm font-medium">Known allergies:</Label>
							<div className="flex flex-wrap gap-2">
								{medicalHistory.allergies.map((allergy) => (
									<Badge key={allergy} variant="destructive" className="cursor-pointer">
										{allergy}
										<X className="h-3 w-3 ml-1" onClick={() => removeItem("allergies", allergy)} />
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
				<p className="font-medium mb-2">Privacy and accuracy:</p>
				<ul className="list-disc list-inside space-y-1">
					<li>All medical information is kept strictly confidential</li>
					<li>Accurate medical history improves risk assessment accuracy</li>
					<li>Include conditions even if they are well-controlled</li>
					<li>You can skip this section if you prefer not to share this information</li>
				</ul>
			</div>
		</div>
	)
}
