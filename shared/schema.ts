// Shared schema definitions for frontend-backend communication
export interface AssessmentSession {
  id: string;
  status: 'in_progress' | 'completed' | 'expired';
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface DemographicData {
  age: number;
  gender: 'male' | 'female' | 'other';
  ethnicity?: string;
  zipCode?: string;
}

export interface VitalSigns {
  height: number;
  weight: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
}

export interface MedicalHistory {
  conditions: string[];
  medications: string[];
  allergies: string[];
  surgeries: string[];
  familyHistory: string[];
}

export interface Symptoms {
  current: string[];
  duration: string[];
  severity: number[];
}

export interface LabResults {
  hbA1c?: number;
  fastingGlucose?: number;
  totalCholesterol?: number;
  hdlCholesterol?: number;
  ldlCholesterol?: number;
  triglycerides?: number;
  creatinine?: number;
  bun?: number;
  [key: string]: number | undefined;
}

export interface RiskFactor {
  factor: string;
  value: string;
  contribution: number;
  direction: 'increases' | 'decreases';
}

export interface RiskScore {
  condition: string;
  score: number;
  confidence: [number, number];
  riskLevel: 'low' | 'moderate' | 'high' | 'very-high';
  keyFactors: RiskFactor[];
}

export interface Provider {
  id: string;
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

export interface ProviderSearchParams {
  zipCode: string;
  specialty?: string;
  radius?: number;
  insuranceProvider?: string;
  acceptingNewPatients?: boolean;
}