import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { 
  assessmentSessionSchema,
  demographicDataSchema,
  vitalSignsSchema,
  medicalHistorySchema,
  symptomsSchema,
  labResultsSchema,
  providerSearchSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Assessment Session Routes
  
  // Create new assessment session
  app.post("/api/assessment/session", async (req, res) => {
    try {
      const session = await storage.createAssessmentSession({
        userId: null, // Anonymous for now
        status: "in_progress"
      });
      
      res.json({ session_id: session.id });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to create assessment session",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update assessment session with form data
  app.patch("/api/assessment/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      // Validate request body
      const updateData = z.object({
        demographicData: demographicDataSchema.optional(),
        vitalSigns: vitalSignsSchema.optional(),
        medicalHistory: medicalHistorySchema.optional(),
        symptoms: symptomsSchema.optional(),
        labResults: labResultsSchema.optional()
      }).parse(req.body);

      const session = await storage.updateAssessmentSession(sessionId, updateData);
      
      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to update assessment session",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // File upload for lab results
  app.post("/api/assessment/upload", async (req, res) => {
    try {
      // In a real implementation, you would handle multipart form data here
      // For now, we'll simulate file processing
      const { session_id } = req.body;
      
      if (!session_id) {
        return res.status(400).json({ message: "Session ID required" });
      }

      // Simulate file processing
      const fileId = `file_${Date.now()}`;
      const mockExtractedData = {
        hbA1c: 7.2,
        fastingGlucose: 140,
        totalCholesterol: 220,
        hdlCholesterol: 40,
        ldlCholesterol: 130
      };

      const uploadedFile = await storage.createUploadedFile({
        sessionId: session_id,
        filename: "lab_results.pdf",
        fileType: "application/pdf",
        extractedData: mockExtractedData,
        processingStatus: "completed"
      });

      res.json({
        file_id: uploadedFile.id,
        extracted_data: mockExtractedData,
        processing_status: "completed",
        confidence_scores: {
          hbA1c: 0.95,
          fastingGlucose: 0.98,
          totalCholesterol: 0.92,
          hdlCholesterol: 0.89,
          ldlCholesterol: 0.87
        }
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to process file upload",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get file processing results
  app.get("/api/assessment/file/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const file = await storage.getUploadedFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      res.json({
        file_id: file.id,
        extracted_data: file.extractedData || {},
        processing_status: file.processingStatus,
        confidence_scores: {} // Would be stored with the file
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get file data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Run risk analysis
  app.post("/api/assessment/analyze/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getAssessmentSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      // Simulate AI risk analysis
      const mockRiskScores = [
        {
          condition: "Diabetes Type 2",
          score: 78,
          confidence: [72, 84] as [number, number],
          risk_level: "high" as const,
          key_factors: [
            { factor: "HbA1c", value: "7.2%", contribution: 0.34, direction: "increases" as const },
            { factor: "BMI", value: "28.5", contribution: 0.18, direction: "increases" as const },
            { factor: "Age", value: "45", contribution: 0.12, direction: "increases" as const },
            { factor: "HDL Cholesterol", value: "40", contribution: -0.07, direction: "decreases" as const }
          ]
        },
        {
          condition: "Heart Disease",
          score: 45,
          confidence: [38, 52] as [number, number],
          risk_level: "moderate" as const,
          key_factors: [
            { factor: "Total Cholesterol", value: "220", contribution: 0.22, direction: "increases" as const },
            { factor: "Blood Pressure", value: "140/90", contribution: 0.19, direction: "increases" as const },
            { factor: "Exercise", value: "sedentary", contribution: 0.15, direction: "increases" as const }
          ]
        },
        {
          condition: "Kidney Disease",
          score: 25,
          confidence: [20, 30] as [number, number],
          risk_level: "low" as const,
          key_factors: [
            { factor: "Creatinine", value: "normal", contribution: -0.12, direction: "decreases" as const },
            { factor: "Blood Pressure", value: "140/90", contribution: 0.08, direction: "increases" as const }
          ]
        }
      ];

      const results = {
        session_id: sessionId,
        risk_scores: mockRiskScores,
        urgency_level: "prompt" as const,
        specialist_recommendations: ["Endocrinologist", "Cardiologist"],
        next_steps: [
          "Schedule appointment with endocrinologist within 2-4 weeks",
          "Begin blood glucose monitoring if recommended",
          "Start 150 minutes moderate exercise weekly",
          "Consider medication evaluation with your doctor",
          "Follow up with lab work in 3 months"
        ],
        created_at: new Date().toISOString()
      };

      // Update session with results
      await storage.updateAssessmentSession(sessionId, {
        status: "completed",
        riskScores: mockRiskScores,
        recommendations: results.next_steps,
        completedAt: new Date()
      });

      res.json(results);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to analyze risks",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get assessment results
  app.get("/api/assessment/results/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getAssessmentSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Assessment session not found" });
      }

      if (session.status !== "completed" || !session.riskScores) {
        return res.status(400).json({ message: "Assessment not completed yet" });
      }

      const results = {
        session_id: sessionId,
        risk_scores: session.riskScores,
        urgency_level: "prompt" as const, // Would be calculated based on risk scores
        specialist_recommendations: ["Endocrinologist", "Cardiologist"],
        next_steps: session.recommendations || [],
        created_at: session.completedAt?.toISOString() || session.createdAt?.toISOString()
      };

      res.json(results);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get assessment results",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Provider Search Routes

  // Search for healthcare providers
  app.post("/api/providers/search", async (req, res) => {
    try {
      const searchParams = providerSearchSchema.parse(req.body);
      const providers = await storage.searchProviders(searchParams);
      
      res.json(providers);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid search parameters", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to search providers",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific provider details
  app.get("/api/providers/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const provider = await storage.getProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      res.json(provider);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get provider details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
