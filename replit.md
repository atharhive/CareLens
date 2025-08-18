# CareLens - AI-Powered Health Risk Assessment Platform

## Overview

CareLens is an advanced AI-powered health risk assessment platform that detects early health risks, connects users with appropriate healthcare providers, and provides personalized health guidance. The platform combines condition-specific machine learning models with transparent explanations to deliver accurate risk predictions for conditions like diabetes, heart disease, and stroke. Built with a privacy-first approach, all user data is processed temporarily and automatically deleted within 30 minutes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based architecture with TypeScript for type safety:
- **Framework**: React with Vite as the build tool for fast development and optimized production builds
- **UI Components**: Shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with custom healthcare-themed color variables and responsive design
- **State Management**: Zustand with persistence middleware for assessment form data and user progress
- **Routing**: Wouter for lightweight client-side routing
- **Data Fetching**: TanStack React Query for server state management and caching

### Backend Architecture
The backend is designed as a FastAPI-based microservice architecture:
- **Framework**: FastAPI with Pydantic for API validation and automatic documentation
- **Machine Learning**: Planned integration with scikit-learn, XGBoost, and LightGBM for condition-specific models
- **Document Processing**: PDF parsing and OCR capabilities for lab report extraction
- **Explainability**: SHAP integration for transparent model predictions
- **Session Management**: Redis for temporary data storage and session handling

### Data Storage Solutions
The application implements a dual-storage approach:
- **Temporary Storage**: Redis for session data, assessment progress, and uploaded files (30-minute TTL)
- **Persistent Storage**: PostgreSQL with Drizzle ORM for healthcare provider data, system configuration, and non-sensitive metadata
- **Privacy Compliance**: No permanent storage of personal health information (PHI) to ensure HIPAA compliance

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
- **Neon Database**: PostgreSQL hosting for persistent data storage
- **Redis**: Session management and temporary data caching
- **Vite**: Frontend build tool and development server

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