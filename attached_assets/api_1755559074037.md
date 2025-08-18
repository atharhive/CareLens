# CareLens - API Documentation

## Overview

The CareLens API provides endpoints for health risk assessment, document processing, care provider discovery, and personalized health recommendations. All endpoints follow RESTful conventions and use JSON for data exchange.

**Base URL:** `https://api.carelens.ai/v1`
**Authentication:** No authentication required (privacy-first design)  
**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)

## Data Flow

```
Client → /ingest/form → /ingest/file → /extract/file → /detect → /triage → /recommend → /carefinder
```

---

## Endpoints

### 1. Data Ingestion

#### POST `/ingest/form`
Submit patient intake form data for processing.

**Request Body:**
```json
{
  "demographics": {
    "age": 45,
    "sex": "M",
    "height": 175,
    "weight": 80,
    "ethnicity": "caucasian"
  },
  "vitals": {
    "systolic_bp": 140,
    "diastolic_bp": 90,
    "heart_rate": 75,
    "temperature": 98.6
  },
  "symptoms": [
    "chest_pain",
    "shortness_of_breath",
    "fatigue"
  ],
  "symptoms_free_text": "Experiencing chest tightness during exercise",
  "medical_history": {
    "conditions": ["hypertension"],
    "medications": ["lisinopril"],
    "family_history": ["diabetes", "heart_disease"],
    "smoking": false,
    "alcohol": "moderate"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "session_id": "uuid-session-identifier",
  "normalized_data": {
    "bmi": 26.1,
    "bp_category": "stage_1_hypertension",
    "risk_factors": ["elevated_bp", "overweight"]
  },
  "validation_warnings": []
}
```

#### POST `/ingest/file`
Upload medical documents (PDF, JPG, PNG) for processing.

**Request:** `multipart/form-data`
- `file`: Medical report file
- `file_type`: "lab_report" | "ecg" | "imaging" | "other"
- `session_id`: Session identifier from form ingestion

**Response:**
```json
{
  "status": "success",
  "file_id": "uuid-file-identifier",
  "file_size": 1048576,
  "file_type": "application/pdf",
  "processing_status": "queued"
}
```

### 2. Document Processing

#### POST `/extract/file/{file_id}`
Extract structured data from uploaded medical documents.

**Path Parameters:**
- `file_id`: UUID identifier from file upload

**Response:**
```json
{
  "status": "success",
  "extraction_results": {
    "lab_values": {
      "hba1c": {"value": 7.2, "unit": "%", "confidence": 0.95},
      "fasting_glucose": {"value": 140, "unit": "mg/dL", "confidence": 0.98},
      "total_cholesterol": {"value": 220, "unit": "mg/dL", "confidence": 0.92},
      "ldl_cholesterol": {"value": 130, "unit": "mg/dL", "confidence": 0.89},
      "hdl_cholesterol": {"value": 40, "unit": "mg/dL", "confidence": 0.93},
      "triglycerides": {"value": 180, "unit": "mg/dL", "confidence": 0.96}
    },
    "text_findings": [
      "Elevated HbA1c suggestive of diabetes",
      "LDL cholesterol above optimal range"
    ],
    "low_confidence_fields": ["ldl_cholesterol"],
    "manual_review_required": false
  }
}
```

### 3. Risk Detection

#### POST `/detect`
Run ML models to assess health risks across multiple conditions.

**Request Body:**
```json
{
  "session_id": "uuid-session-identifier",
  "patient_data": {
    // Combined form data and extracted lab values
  },
  "conditions": ["diabetes", "heart_disease", "stroke", "ckd", "liver", "anemia", "thyroid"],
  "include_explanations": true
}
```

**Response:**
```json
{
  "status": "success",
  "detection_results": {
    "diabetes": {
      "risk_score": 0.78,
      "risk_category": "high",
      "confidence_interval": [0.72, 0.84],
      "top_features": [
        {"feature": "hba1c", "value": 7.2, "contribution": 0.34, "direction": "increases_risk"},
        {"feature": "bmi", "value": 26.1, "contribution": 0.18, "direction": "increases_risk"},
        {"feature": "age", "value": 45, "contribution": 0.12, "direction": "increases_risk"}
      ],
      "model_card": {
        "model_id": "diabetes_xgb_v2.1",
        "auc": 0.87,
        "sensitivity": 0.82,
        "specificity": 0.79,
        "calibration_method": "isotonic",
        "training_data": "UCI Pima Indians + Synthetic Augmentation"
      }
    },
    "heart_disease": {
      "risk_score": 0.65,
      "risk_category": "moderate",
      "confidence_interval": [0.58, 0.71],
      "top_features": [
        {"feature": "ldl_cholesterol", "value": 130, "contribution": 0.28, "direction": "increases_risk"},
        {"feature": "systolic_bp", "value": 140, "contribution": 0.22, "direction": "increases_risk"},
        {"feature": "hdl_cholesterol", "value": 40, "contribution": -0.15, "direction": "decreases_risk"}
      ],
      "model_card": {
        "model_id": "heart_disease_ensemble_v1.8",
        "auc": 0.84,
        "sensitivity": 0.78,
        "specificity": 0.81
      }
    }
  },
  "overall_summary": {
    "highest_risk_condition": "diabetes",
    "risk_factors_count": 5,
    "protective_factors_count": 1
  }
}
```

### 4. Triage & Care Coordination

#### POST `/triage`
Determine urgency level and appropriate specialist recommendations.

**Request Body:**
```json
{
  "session_id": "uuid-session-identifier",
  "detection_results": {
    // Results from /detect endpoint
  },
  "symptoms": ["chest_pain", "shortness_of_breath"],
  "acute_flags": {
    "severe_chest_pain": false,
    "difficulty_breathing": true,
    "loss_of_consciousness": false
  }
}
```

**Response:**
```json
{
  "status": "success",
  "triage_result": {
    "urgency_level": "amber",
    "urgency_score": 7,
    "timeframe": "within_72_hours",
    "rationale": "High diabetes risk with elevated HbA1c requires prompt endocrinology evaluation",
    "red_flags": [],
    "recommended_specialists": [
      {
        "specialty": "endocrinology",
        "reason": "Diabetes management and metabolic syndrome evaluation",
        "priority": 1
      },
      {
        "specialty": "cardiology",
        "reason": "Cardiovascular risk assessment given multiple risk factors",
        "priority": 2
      }
    ],
    "safety_netting": {
      "warning_signs": [
        "Severe chest pain",
        "Extreme shortness of breath",
        "Loss of consciousness"
      ],
      "emergency_contact": "If symptoms worsen, call emergency services immediately"
    }
  }
}
```

#### GET `/carefinder`
Find nearby healthcare providers based on location and specialty.

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `specialty`: Specialist type (required)
- `radius`: Search radius in km (default: 25)
- `insurance`: Insurance type (optional)
- `language`: Preferred language (optional)

**Response:**
```json
{
  "status": "success",
  "providers": [
    {
      "id": "provider_12345",
      "name": "Dr. Sarah Johnson",
      "specialty": "Endocrinology",
      "practice_name": "Metro Diabetes Center",
      "address": {
        "street": "123 Medical Plaza",
        "city": "Springfield",
        "state": "IL",
        "zip": "62701"
      },
      "contact": {
        "phone": "+1-555-0123",
        "website": "https://metrodiabetes.com"
      },
      "distance_km": 3.2,
      "rating": 4.7,
      "accepts_new_patients": true,
      "insurance_accepted": ["blue_cross", "aetna", "medicare"],
      "languages": ["english", "spanish"],
      "hours": {
        "monday": "08:00-17:00",
        "tuesday": "08:00-17:00",
        "wednesday": "08:00-17:00",
        "thursday": "08:00-17:00",
        "friday": "08:00-16:00"
      }
    }
  ],
  "total_results": 15,
  "search_parameters": {
    "location": "Springfield, IL",
    "specialty": "endocrinology",
    "radius_km": 25
  }
}
```

### 5. Personalized Recommendations

#### POST `/recommend`
Generate personalized health guidance and action plans.

**Request Body:**
```json
{
  "session_id": "uuid-session-identifier",
  "detection_results": {
    // Results from /detect endpoint
  },
  "triage_result": {
    // Results from /triage endpoint
  },
  "patient_preferences": {
    "language": "english",
    "dietary_restrictions": ["vegetarian"],
    "activity_level": "moderate",
    "health_goals": ["weight_loss", "blood_sugar_control"]
  }
}
```

**Response:**
```json
{
  "status": "success",
  "recommendations": {
    "immediate_actions": [
      {
        "action": "Schedule endocrinology appointment",
        "timeframe": "within_72_hours",
        "reason": "High diabetes risk requires specialist evaluation"
      },
      {
        "action": "Begin blood glucose monitoring",
        "timeframe": "immediately",
        "instructions": "Check fasting glucose daily, log results"
      }
    ],
    "lifestyle_modifications": {
      "diet": {
        "recommendations": [
          "Reduce simple carbohydrate intake",
          "Increase fiber-rich vegetables",
          "Consider Mediterranean diet pattern"
        ],
        "specific_goals": {
          "carb_limit": "45-60g per meal",
          "fiber_target": "25-30g daily"
        },
        "vegetarian_adaptations": [
          "Focus on plant-based proteins",
          "Include legumes and quinoa"
        ]
      },
      "exercise": {
        "recommendations": [
          "150 minutes moderate aerobic activity weekly",
          "2-3 resistance training sessions",
          "Daily 10-minute walks after meals"
        ],
        "modifications_for_risk": [
          "Start gradually due to cardiovascular risk factors",
          "Monitor blood pressure before/after exercise"
        ]
      },
      "monitoring": {
        "glucose_checks": "Daily fasting, 2-hour post-meal",
        "blood_pressure": "Weekly home monitoring",
        "weight": "Daily morning weigh-ins"
      }
    },
    "lab_follow_up": {
      "recommended_tests": [
        {"test": "HbA1c", "timeframe": "3_months"},
        {"test": "Lipid panel", "timeframe": "6_weeks"},
        {"test": "Comprehensive metabolic panel", "timeframe": "3_months"}
      ]
    },
    "educational_resources": [
      {
        "title": "Understanding Diabetes Risk",
        "url": "https://education.carelens.ai/diabetes-basics",
        "type": "article"
      },
      {
        "title": "Heart-Healthy Living",
        "url": "https://education.carelens.ai/heart-health",
        "type": "video"
      }
    ],
    "questions_for_doctor": [
      "Should I start diabetes medication given my HbA1c level?",
      "What are my cardiovascular risk factors and how can I address them?",
      "How often should I monitor my blood sugar?"
    ]
  }
}
```

### 6. Result Sharing

#### POST `/share/create`
Create a shareable link for results (optional feature).

**Request Body:**
```json
{
  "session_id": "uuid-session-identifier",
  "include_sections": ["risk_scores", "recommendations", "provider_list"],
  "expiry_days": 7,
  "access_level": "view_only"
}
```

**Response:**
```json
{
  "status": "success",
  "share_link": "https://share.carelens.ai/r/abc123def456",
  "share_id": "abc123def456",
  "expires_at": "2024-01-15T00:00:00Z",
  "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSU..."
}
```

#### GET `/share/{share_id}`
Retrieve shared results (read-only view).

**Response:** Static HTML page with embedded result data

---

## Data Schemas

### Patient Demographics
```typescript
interface Demographics {
  age: number;                    // Years
  sex: "M" | "F" | "other";      
  height: number;                 // cm
  weight: number;                 // kg
  ethnicity?: string;
  bmi?: number;                   // Calculated if not provided
}
```

### Lab Values
```typescript
interface LabValue {
  value: number;
  unit: string;
  confidence: number;             // 0.0 - 1.0
  reference_range?: string;
  abnormal_flag?: "high" | "low" | "critical";
}

interface LabResults {
  // Diabetes markers
  hba1c?: LabValue;              // %
  fasting_glucose?: LabValue;     // mg/dL
  random_glucose?: LabValue;      // mg/dL
  
  // Lipid panel
  total_cholesterol?: LabValue;   // mg/dL
  ldl_cholesterol?: LabValue;     // mg/dL
  hdl_cholesterol?: LabValue;     // mg/dL
  triglycerides?: LabValue;       // mg/dL
  
  // Kidney function
  creatinine?: LabValue;          // mg/dL
  bun?: LabValue;                 // mg/dL
  egfr?: LabValue;                // mL/min/1.73m²
  
  // Liver function
  ast?: LabValue;                 // U/L
  alt?: LabValue;                 // U/L
  bilirubin?: LabValue;           // mg/dL
  
  // Complete blood count
  hemoglobin?: LabValue;          // g/dL
  hematocrit?: LabValue;          // %
  mcv?: LabValue;                 // fL
  
  // Thyroid function
  tsh?: LabValue;                 // mIU/L
  free_t4?: LabValue;             // ng/dL
}
```

### Risk Assessment
```typescript
interface RiskAssessment {
  condition: string;
  risk_score: number;             // 0.0 - 1.0
  risk_category: "low" | "moderate" | "high" | "very_high";
  confidence_interval: [number, number];
  top_features: FeatureAttribution[];
  model_card: ModelCard;
}

interface FeatureAttribution {
  feature: string;
  value: number | string;
  contribution: number;           // SHAP value
  direction: "increases_risk" | "decreases_risk";
}

interface ModelCard {
  model_id: string;
  version: string;
  auc: number;
  sensitivity: number;
  specificity: number;
  calibration_method: "platt" | "isotonic";
  training_data: string;
  limitations: string[];
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid input parameters",
  "details": {
    "field": "age",
    "issue": "Age must be between 18 and 120"
  },
  "request_id": "req_abc123"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid input data
- `FILE_PROCESSING_ERROR`: Document extraction failed
- `MODEL_ERROR`: ML inference failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

---

## Rate Limiting

- **Form ingestion**: 10 requests/minute
- **File upload**: 5 requests/minute  
- **Detection**: 10 requests/minute
- **Provider search**: 20 requests/minute

Rate limits are enforced per IP address.

---

## Privacy & Security

### Data Retention
- Session data: Automatically purged after 30 minutes
- Uploaded files: Deleted after processing (< 5 minutes)
- Share links: Optional, max 7 days TTL

### Data Processing
- All processing happens in-memory when possible
- No persistent storage of health data
- HTTPS encryption for all communications
- No authentication cookies or tracking

### HIPAA Compliance
- Business Associate Agreement available for enterprise use
- Audit logging for all data access
- Encryption at rest and in transit
- Data minimization principles applied
