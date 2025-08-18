import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DemographicData, VitalSigns, MedicalHistory, Symptoms, LabResults } from '@shared/schema';
import type { AssessmentStep, AssessmentProgress } from '@/types/assessment';

interface AssessmentState {
  sessionId: string | null;
  currentStep: AssessmentStep;
  completedSteps: AssessmentStep[];
  
  // Form data
  demographicData: Partial<DemographicData>;
  vitalSigns: Partial<VitalSigns>;
  medicalHistory: Partial<MedicalHistory>;
  symptoms: Partial<Symptoms>;
  labResults: Partial<LabResults>;
  
  // Uploaded files
  uploadedFiles: string[];
  
  // Actions
  setSessionId: (id: string) => void;
  setCurrentStep: (step: AssessmentStep) => void;
  markStepCompleted: (step: AssessmentStep) => void;
  updateDemographicData: (data: Partial<DemographicData>) => void;
  updateVitalSigns: (data: Partial<VitalSigns>) => void;
  updateMedicalHistory: (data: Partial<MedicalHistory>) => void;
  updateSymptoms: (data: Partial<Symptoms>) => void;
  updateLabResults: (data: Partial<LabResults>) => void;
  addUploadedFile: (fileId: string) => void;
  resetAssessment: () => void;
  getProgress: () => AssessmentProgress;
}

const stepOrder: AssessmentStep[] = ['demographics', 'vitals', 'history', 'symptoms', 'labs', 'review'];

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      sessionId: null,
      currentStep: 'demographics',
      completedSteps: [],
      
      demographicData: {},
      vitalSigns: {},
      medicalHistory: {},
      symptoms: {},
      labResults: {},
      uploadedFiles: [],
      
      setSessionId: (id) => set({ sessionId: id }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      markStepCompleted: (step) => set((state) => ({
        completedSteps: state.completedSteps.includes(step) 
          ? state.completedSteps 
          : [...state.completedSteps, step]
      })),
      
      updateDemographicData: (data) => set((state) => ({
        demographicData: { ...state.demographicData, ...data }
      })),
      
      updateVitalSigns: (data) => set((state) => ({
        vitalSigns: { ...state.vitalSigns, ...data }
      })),
      
      updateMedicalHistory: (data) => set((state) => ({
        medicalHistory: { ...state.medicalHistory, ...data }
      })),
      
      updateSymptoms: (data) => set((state) => ({
        symptoms: { ...state.symptoms, ...data }
      })),
      
      updateLabResults: (data) => set((state) => ({
        labResults: { ...state.labResults, ...data }
      })),
      
      addUploadedFile: (fileId) => set((state) => ({
        uploadedFiles: [...state.uploadedFiles, fileId]
      })),
      
      resetAssessment: () => set({
        sessionId: null,
        currentStep: 'demographics',
        completedSteps: [],
        demographicData: {},
        vitalSigns: {},
        medicalHistory: {},
        symptoms: {},
        labResults: {},
        uploadedFiles: [],
      }),
      
      getProgress: () => {
        const state = get();
        return {
          current_step: state.currentStep,
          completed_steps: state.completedSteps,
          total_steps: stepOrder.length,
        };
      },
    }),
    {
      name: 'assessment-storage',
      partialize: (state) => ({
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        demographicData: state.demographicData,
        vitalSigns: state.vitalSigns,
        medicalHistory: state.medicalHistory,
        symptoms: state.symptoms,
        labResults: state.labResults,
        uploadedFiles: state.uploadedFiles,
      }),
    }
  )
);
