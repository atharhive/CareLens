import { apiRequest } from './queryClient';
import type { 
  DemographicData, 
  VitalSigns, 
  MedicalHistory, 
  Symptoms, 
  LabResults,
  ProviderSearch 
} from '@shared/schema';
import type { AssessmentResults, FileUploadResponse } from '@/types/assessment';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const assessmentApi = {
  // Create new assessment session
  createSession: async (): Promise<{ session_id: string }> => {
    const response = await apiRequest('POST', `${API_BASE_URL}/assessment/session`, {});
    return response.json();
  },

  // Submit form data for a session
  submitFormData: async (sessionId: string, data: {
    demographicData?: DemographicData;
    vitalSigns?: VitalSigns;
    medicalHistory?: MedicalHistory;
    symptoms?: Symptoms;
    labResults?: LabResults;
  }): Promise<{ success: boolean }> => {
    const response = await apiRequest('PATCH', `${API_BASE_URL}/assessment/session/${sessionId}`, data);
    return response.json();
  },

  // Upload file for lab results extraction
  uploadFile: async (sessionId: string, file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('session_id', sessionId);
    
    const response = await fetch(`${API_BASE_URL}/assessment/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Get extracted data from uploaded file
  getFileData: async (fileId: string): Promise<FileUploadResponse> => {
    const response = await apiRequest('GET', `${API_BASE_URL}/assessment/file/${fileId}`, undefined);
    return response.json();
  },

  // Run risk assessment
  analyzeRisks: async (sessionId: string): Promise<AssessmentResults> => {
    const response = await apiRequest('POST', `${API_BASE_URL}/assessment/analyze/${sessionId}`, {});
    return response.json();
  },

  // Get assessment results
  getResults: async (sessionId: string): Promise<AssessmentResults> => {
    const response = await apiRequest('GET', `${API_BASE_URL}/assessment/results/${sessionId}`, undefined);
    return response.json();
  },
};

export const providersApi = {
  // Search for healthcare providers
  searchProviders: async (searchParams: ProviderSearch) => {
    const response = await apiRequest('POST', `${API_BASE_URL}/providers/search`, searchParams);
    return response.json();
  },

  // Get provider details
  getProvider: async (providerId: string) => {
    const response = await apiRequest('GET', `${API_BASE_URL}/providers/${providerId}`, undefined);
    return response.json();
  },
};

// Utility function to get user's location
export const getUserLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000, // 10 minutes
      }
    );
  });
};
