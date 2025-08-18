# CareLens - AI-Powered Health Risk Assessment Platform

## Overview

CareLens is an advanced AI-powered health risk assessment platform that detects early health risks, connects users with appropriate healthcare providers, and provides personalized health guidance. The platform combines condition-specific machine learning models with transparent explanations to deliver accurate risk predictions for conditions like diabetes, heart disease, and stroke. Built with a privacy-first approach, all user data is processed temporarily and automatically deleted within 30 minutes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses Next.js with TypeScript for a modern, scalable frontend:
- **Framework**: Next.js 15 with React 19 for SSR/SSG capabilities and optimized performance
- **UI Components**: Shadcn/ui components built on Radix UI primitives for accessibility and customization  
- **Styling**: Tailwind CSS with custom healthcare-themed color variables and responsive design
- **State Management**: Zustand for client-side state management with persistence middleware
- **API Integration**: Custom API client with TypeScript interfaces for FastAPI backend communication
- **Data Fetching**: Built-in Next.js fetch with error handling and loading states

### Backend Architecture  
The backend is implemented as a production-ready FastAPI microservice:
- **Framework**: FastAPI with Pydantic for API validation and automatic OpenAPI documentation
- **Machine Learning**: Integrated scikit-learn, XGBoost, and LightGBM for condition-specific risk models
- **Document Processing**: PDF parsing and OCR capabilities using pdfplumber, camelot, and pytesseract
- **Explainability**: SHAP integration for transparent model predictions and feature attribution
- **Session Management**: Redis for temporary data storage with 30-minute TTL for HIPAA compliance
- **Privacy**: Automatic data deletion and anonymized logging for healthcare compliance

### Data Storage Solutions
The application implements a privacy-first storage approach:
- **Temporary Storage**: Redis for session data, assessment progress, and uploaded files (30-minute TTL)
- **File Storage**: Local temporary storage for uploaded documents with automatic cleanup
- **Privacy Compliance**: No permanent storage of personal health information (PHI) to ensure HIPAA compliance
- **Configuration**: Environment-based settings for deployment flexibility

### Assessment Flow Architecture
The system follows a multi-step assessment pipeline:
1. **Data Ingestion**: Form-based demographic, vital signs, medical history, and symptom collection
2. **Document Processing**: Optional lab report upload with OCR and structured data extraction
3. **Risk Detection**: ML model inference using condition-specific algorithms
4. **Risk Calibration**: Probability calibration using Platt or Isotonic scaling for trustworthy predictions
5. **Explanation Generation**: SHAP-based feature attribution for transparent risk factors
6. **Care Navigation**: Provider matching based on risk levels and geographic location

## External Dependencies

### Core Infrastructure
- **Redis**: Session management and temporary data caching
- **Next.js**: Full-stack React framework with SSR capabilities
- **FastAPI**: High-performance Python web framework for APIs

### UI and Component Libraries
- **Radix UI**: Accessible component primitives for forms, dialogs, and navigation
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent UI elements
- **React Hook Form**: Form state management with validation

### Data Management and APIs
- **Drizzle ORM**: Type-safe database queries and migrations
- **TanStack React Query**: Server state synchronization and caching
- **Zod**: Runtime schema validation for API requests and responses

### Machine Learning and Analytics
- **Planned**: scikit-learn ecosystem for model training and inference
- **Planned**: SHAP for model explainability
- **Planned**: Redis ML for model serving and caching

### Healthcare-Specific Integrations
- **Planned**: Google Maps API for healthcare provider location services
- **Planned**: FHIR-compliant data processing for interoperability
- **Planned**: OCR services for lab report processing

### Development and Testing
- **TypeScript**: Static type checking across the full stack
- **ESLint and Prettier**: Code quality and formatting
- **Playwright**: End-to-end testing for critical user flows
- **Jest**: Unit testing for utility functions and components

The architecture prioritizes healthcare compliance, user privacy, and scalable ML model deployment while maintaining a smooth user experience across web and mobile devices.