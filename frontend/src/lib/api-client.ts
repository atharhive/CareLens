/**
 * API client for connecting Next.js frontend to FastAPI backend
 * Handles authentication, error handling, and request/response formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  request_id?: string;
  timestamp?: number;
}

export interface AssessmentSession {
  session_id: string;
  status: 'active' | 'completed' | 'expired';
  created_at: string;
  expires_at: string;
}

export interface RiskScore {
  condition: string;
  score: number;
  confidence: [number, number];
  risk_level: 'low' | 'moderate' | 'high' | 'very-high';
  key_factors: {
    factor: string;
    value: string;
    contribution: number;
    direction: 'increases' | 'decreases';
  }[];
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
  distance?: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || 'Request failed',
          message: data.detail || data.message || 'Unknown error occurred',
          request_id: data.request_id,
          timestamp: data.timestamp,
        };
      }

      return { data };
    } catch (error) {
      return {
        error: 'Network Error',
        message: error instanceof Error ? error.message : 'Failed to connect to server',
      };
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    return this.request('/health');
  }

  // Assessment API
  async createAssessmentSession(): Promise<ApiResponse<AssessmentSession>> {
    return this.request('/ingest/session', { method: 'POST' });
  }

  async updateAssessmentData(sessionId: string, data: any): Promise<ApiResponse> {
    return this.request(`/ingest/session/${sessionId}/data`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async uploadDocument(sessionId: string, file: File): Promise<ApiResponse<{
    file_id: string;
    extracted_data: any;
    processing_status: string;
    confidence_scores: Record<string, number>;
  }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);

    return this.request('/extract/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type to let browser set it for FormData
    });
  }

  async runRiskAnalysis(sessionId: string): Promise<ApiResponse<{
    session_id: string;
    risk_scores: RiskScore[];
    urgency_level: 'routine' | 'prompt' | 'urgent' | 'immediate';
    specialist_recommendations: string[];
    next_steps: string[];
    created_at: string;
  }>> {
    return this.request(`/detect/analyze/${sessionId}`, { method: 'POST' });
  }

  async getAssessmentResults(sessionId: string): Promise<ApiResponse<{
    session_id: string;
    risk_scores: RiskScore[];
    urgency_level: string;
    specialist_recommendations: string[];
    next_steps: string[];
    created_at: string;
  }>> {
    return this.request(`/detect/results/${sessionId}`);
  }

  // Provider search
  async searchProviders(params: {
    zipCode: string;
    specialty?: string;
    radius?: number;
    insurance?: string;
    acceptingNewPatients?: boolean;
  }): Promise<ApiResponse<Provider[]>> {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request(`/carefinder/search?${queryString}`);
  }

  async getProvider(providerId: string): Promise<ApiResponse<Provider>> {
    return this.request(`/carefinder/providers/${providerId}`);
  }

  // Recommendations
  async getPersonalizedRecommendations(sessionId: string): Promise<ApiResponse<{
    lifestyle_changes: string[];
    dietary_guidelines: string[];
    exercise_plan: string[];
    monitoring_schedule: string[];
    follow_up_timeline: string[];
  }>> {
    return this.request(`/recommend/personalized/${sessionId}`);
  }

  // Result sharing
  async createShareLink(sessionId: string, options: {
    include_personal_info?: boolean;
    expires_in_days?: number;
  } = {}): Promise<ApiResponse<{
    share_id: string;
    share_url: string;
    expires_at: string;
    qr_code?: string;
  }>> {
    return this.request(`/share/create/${sessionId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getSharedResults(shareId: string): Promise<ApiResponse<{
    risk_scores: RiskScore[];
    recommendations: string[];
    created_at: string;
    anonymized: boolean;
  }>> {
    return this.request(`/share/${shareId}`);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
export default apiClient;