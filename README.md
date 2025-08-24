# CareLens 🔬💡

*Advanced AI-Powered Health Risk Assessment Platform*

<!-- Badges -->
<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![GitHub issues](https://img.shields.io/github/issues/atharhive/CareLens)](https://github.com/atharhive/CareLens/issues)
[![Documentation](https://img.shields.io/badge/docs-available-brightgreen.svg)](docs/)
[![Demo](https://img.shields.io/badge/demo-coming%20soon-orange.svg)](#)

</div>

<!-- Technology Stack Badges -->
<div align="center">

**Technology Stack:**

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/features/actions)
[![AWS](https://img.shields.io/badge/Amazon_AWS-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)](https://aws.amazon.com/)

</div>

A cutting-edge web application that **Detects** early risk, **Connects** people to the right care, and **Personalizes** guidance using advanced ML models and intelligent data processing.

> **Note:** This project is currently in development. The documentation in the `docs` folder reflects the planned architecture and features, while this README provides an overview of the current state.

## 🎬 Demo Video

<!-- Placeholder for YouTube Demo Video -->
<div align="center">

**Watch a demo of CareLens in action:**

[![CareLens Demo Video](https://img.youtube.com/vi/YOUTUBE_VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID)

</div>

## 🌐 Demo Website

<!-- Placeholder for Demo Website Link -->
<div align="center">

**Try out the live demo:**

[**demo.carelens.ai**](https://your-demo-website-link.com)

</div>

## 🎯 Vision & Mission

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+ with pip
- Redis 6.0+ (for caching)
- Git 2.30+

### Installation & Setup

```bash
# Clone repository
git clone https://github.com/atharhive/CareLens.git
cd CareLens

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Environment configuration
cp .env.example .env
# Edit .env with your settings
```

### Development Servers

```bash
# Terminal 1: Redis
redis-server

# Terminal 2: Backend (FastAPI)
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend (Next.js)
cd frontend && npm run dev
```

**Access Points:**
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend API: http://localhost:8000
- 📚 API Docs: http://localhost:8000/docs

## 📂 Project Structure

```
CareLens/
├── frontend/           # Next.js application
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/            # FastAPI application
│   ├── app/
│   ├── tests/
│   └── requirements.txt
├── docs/               # Comprehensive documentation
└── .gitignore
```

## 📄 Documentation

For detailed information about the project's vision, architecture, and features, please see the `docs` folder.

## 🤝 Contributing

Contributions are welcome! Please see the `CONTRIBUTING.md` file for details.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
