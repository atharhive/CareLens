export interface Demographics {
  age?: number
  sex?: "male" | "female" | "other"
  height?: number
  weight?: number
  ethnicity?: string
  heightUnit: "cm" | "ft"
  weightUnit: "kg" | "lbs"
}

export interface Vitals {
  systolicBP?: number
  diastolicBP?: number
  heartRate?: number
  temperature?: number
  temperatureUnit: "celsius" | "fahrenheit"
}

export interface MedicalHistory {
  conditions: string[]
  medications: string[]
  familyHistory: string[]
  allergies: string[]
}

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  extractedData?: LabResult[]
  processingStatus: "pending" | "processing" | "completed" | "error"
}

export interface LabResult {
  testName: string
  value: number
  unit: string
  referenceRange: string
  confidence: number
}

export interface DetectionResults {
  diabetes: RiskScore
  heartDisease: RiskScore
  stroke: RiskScore
  ckd: RiskScore
  liver: RiskScore
  anemia: RiskScore
  thyroid: RiskScore
}

export interface RiskScore {
  score: number
  category: "low" | "moderate" | "high" | "critical"
  confidence: number
  contributingFactors: ContributingFactor[]
  modelMetrics: ModelMetrics
}

export interface ContributingFactor {
  feature: string
  impact: number
  direction: "positive" | "negative"
  explanation: string
}

export interface ModelMetrics {
  auc: number
  sensitivity: number
  specificity: number
  calibration: number
}

export interface TriageResult {
  urgency: "green" | "amber" | "red"
  timeframe: string
  actions: string[]
  warnings: string[]
}

export interface Recommendations {
  immediate: Action[]
  lifestyle: LifestyleRecommendation[]
  followUp: FollowUpRecommendation[]
  educational: EducationalResource[]
}

export interface Action {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  timeframe: string
}

export interface LifestyleRecommendation {
  category: "diet" | "exercise" | "monitoring" | "sleep" | "stress"
  title: string
  description: string
  specifics: string[]
}

export interface FollowUpRecommendation {
  type: "lab" | "appointment" | "screening"
  title: string
  timeframe: string
  description: string
}

export interface EducationalResource {
  title: string
  description: string
  url: string
  type: "article" | "video" | "pdf"
}

export interface Provider {
  id: string
  name: string
  specialty: string
  practice: string
  address: string
  distance: number
  rating: number
  reviewCount: number
  acceptsInsurance: string[]
  languages: string[]
  availability: string
  phone: string
  website?: string
}

export interface Location {
  latitude: number
  longitude: number
  address: string
}

export interface ShareSettings {
  id: string
  expiresAt: Date
  accessLevel: "view" | "full"
  password?: string
  allowedEmails?: string[]
}
