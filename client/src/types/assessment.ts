export interface RiskScore {
  condition: string;
  score: number;
  confidence: [number, number];
  risk_level: 'low' | 'moderate' | 'high' | 'very_high';
  key_factors: Array<{
    factor: string;
    value: string | number;
    contribution: number;
    direction: 'increases' | 'decreases';
  }>;
}

export interface AssessmentResults {
  session_id: string;
  risk_scores: RiskScore[];
  urgency_level: 'routine' | 'prompt' | 'urgent';
  specialist_recommendations: string[];
  next_steps: string[];
  created_at: string;
}

export interface FileUploadResponse {
  file_id: string;
  extracted_data: Record<string, any>;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence_scores: Record<string, number>;
}

export type AssessmentStep = 'demographics' | 'vitals' | 'history' | 'symptoms' | 'labs' | 'review';

export interface AssessmentProgress {
  current_step: AssessmentStep;
  completed_steps: AssessmentStep[];
  total_steps: number;
}
