import { sql } from "drizzle-orm";
import { pgTable, text, varchar, json, timestamp, real, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const assessmentSessions = pgTable("assessment_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, expired
  demographicData: json("demographic_data"),
  vitalSigns: json("vital_signs"),
  medicalHistory: json("medical_history"),
  symptoms: json("symptoms"),
  labResults: json("lab_results"),
  riskScores: json("risk_scores"),
  recommendations: json("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").default(sql`NOW() + INTERVAL '30 minutes'`),
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  extractedData: json("extracted_data"),
  processingStatus: text("processing_status").notNull().default("pending"), // pending, processing, completed, failed
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const healthcareProviders = pgTable("healthcare_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  website: text("website"),
  rating: real("rating"),
  acceptsNewPatients: boolean("accepts_new_patients").default(true),
  languages: json("languages").default([]),
  insuranceAccepted: json("insurance_accepted").default([]),
  latitude: real("latitude"),
  longitude: real("longitude"),
});

// Schemas for API validation
export const demographicDataSchema = z.object({
  age: z.number().min(18).max(120),
  sex: z.enum(["male", "female", "other"]),
  height: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  ethnicity: z.string().optional(),
});

export const vitalSignsSchema = z.object({
  systolicBP: z.number().min(60).max(300).optional(),
  diastolicBP: z.number().min(30).max(200).optional(),
  heartRate: z.number().min(40).max(200).optional(),
  temperature: z.number().min(95).max(110).optional(),
});

export const medicalHistorySchema = z.object({
  currentConditions: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  familyHistory: z.array(z.string()).default([]),
  smoking: z.enum(["never", "former", "current"]),
  alcohol: z.enum(["none", "light", "moderate", "heavy"]),
  exercise: z.enum(["sedentary", "light", "moderate", "active"]),
});

export const symptomsSchema = z.object({
  chestPain: z.boolean().default(false),
  shortnessOfBreath: z.boolean().default(false),
  fatigue: z.boolean().default(false),
  frequentUrination: z.boolean().default(false),
  excessiveThirst: z.boolean().default(false),
  weightLoss: z.boolean().default(false),
  dizziness: z.boolean().default(false),
  palpitations: z.boolean().default(false),
});

export const labResultsSchema = z.object({
  hbA1c: z.number().optional(),
  fastingGlucose: z.number().optional(),
  randomGlucose: z.number().optional(),
  totalCholesterol: z.number().optional(),
  ldlCholesterol: z.number().optional(),
  hdlCholesterol: z.number().optional(),
  triglycerides: z.number().optional(),
  creatinine: z.number().optional(),
  bun: z.number().optional(),
  egfr: z.number().optional(),
  hemoglobin: z.number().optional(),
  tsh: z.number().optional(),
});

export const assessmentSessionSchema = createInsertSchema(assessmentSessions, {
  demographicData: demographicDataSchema.optional(),
  vitalSigns: vitalSignsSchema.optional(),
  medicalHistory: medicalHistorySchema.optional(),
  symptoms: symptomsSchema.optional(),
  labResults: labResultsSchema.optional(),
}).omit({
  id: true,
  createdAt: true,
  completedAt: true,
  expiresAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const providerSearchSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().min(1).max(50).default(25),
  specialty: z.string().optional(),
  acceptsNewPatients: z.boolean().optional(),
  language: z.string().optional(),
  insurance: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type AssessmentSession = typeof assessmentSessions.$inferSelect;
export type InsertAssessmentSession = z.infer<typeof assessmentSessionSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type HealthcareProvider = typeof healthcareProviders.$inferSelect;
export type DemographicData = z.infer<typeof demographicDataSchema>;
export type VitalSigns = z.infer<typeof vitalSignsSchema>;
export type MedicalHistory = z.infer<typeof medicalHistorySchema>;
export type Symptoms = z.infer<typeof symptomsSchema>;
export type LabResults = z.infer<typeof labResultsSchema>;
export type ProviderSearch = z.infer<typeof providerSearchSchema>;
