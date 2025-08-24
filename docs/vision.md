# 🎯 Vision & Mission

**Goal:** Empower individuals and healthcare professionals with accurate, AI-driven health risk assessment and personalized care guidance.

**Why CareLens over generic LLMs?**
- ✅ **Condition-specific ML models** trained on vetted medical datasets
- ✅ **Probability calibration** (Platt/Isotonic) for trustworthy risk scores
- ✅ **Transparent feature attribution** using SHAP
- ✅ **Clinical validation** with documented metrics and model cards
- ❌ **No hallucinations** - LLMs used only for explanations, never diagnosis

## 🌟 Core Features

### 🔬 Multi-Condition Detection Engine
- **7 Specialized Models**: Diabetes, Heart Disease, Stroke, CKD, Liver Disease, Anemia, Thyroid
- **Calibrated Risk Scores**: Probability calibration using Platt/Isotonic scaling
- **Feature Attribution**: SHAP-based explanations for transparency
- **Model Cards**: Full transparency with AUC, sensitivity, specificity metrics

### 📄 Intelligent Document Processing
- **PDF/Image OCR**: Extract lab values from medical reports
- **Table Detection**: Automated parsing using `pdfplumber` and `camelot`
- **Unit Normalization**: Automatic conversion between measurement units
- **Confidence Scoring**: Flag low-confidence extractions for manual review

### 🎯 Smart Triage & Care Navigation
- **Urgency Classification**: Red/Amber/Green risk levels with timeframes
- **Specialist Mapping**: Automatic recommendation of appropriate specialists
- **Care Finder**: Location-based provider discovery with distance/hours
- **Visit Preparation**: Exportable checklists and questions for doctors

### 👤 Personalized Health Plans
- **Rule-Based Recommendations**: Condition-specific guidance
- **Cultural Adaptation**: Multi-language support and cultural considerations
- **Lifestyle Integration**: Diet, exercise, and monitoring schedules
- **Progress Tracking**: Follow-up timelines and lab retesting windows
