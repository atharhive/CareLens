/**
 * CareLens Homepage - AI-Powered Health Risk Assessment Platform
 */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Brain, Activity, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function HomePage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [backendInfo, setBackendInfo] = useState<any>(null);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await apiClient.healthCheck();
      if (response.data) {
        setBackendStatus('connected');
        setBackendInfo(response.data);
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      setBackendStatus('disconnected');
    }
  };

  const startAssessment = async () => {
    if (backendStatus !== 'connected') {
      alert('Backend is not connected. Please start the FastAPI backend server first.');
      return;
    }

    try {
      const response = await apiClient.createAssessmentSession();
      if (response.data) {
        // Redirect to assessment page with session ID
        window.location.href = `/assessment?session=${response.data.session_id}`;
      } else {
        alert('Failed to create assessment session: ' + response.message);
      }
    } catch (error) {
      alert('Error starting assessment: ' + error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CareLens</h1>
            </div>
            
            {/* Backend Status */}
            <div className="flex items-center space-x-2">
              {backendStatus === 'checking' && (
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="text-sm">Checking backend...</span>
                </div>
              )}
              {backendStatus === 'connected' && (
                <div className="flex items-center space-x-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Backend Connected</span>
                </div>
              )}
              {backendStatus === 'disconnected' && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Backend Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            AI-Powered Health Risk
            <span className="text-blue-600"> Assessment</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Get personalized health insights with our advanced machine learning platform. 
            Assess your risk for diabetes, heart disease, and other conditions in minutes.
          </p>
          
          <div className="mt-10 flex justify-center space-x-4">
            <Button 
              onClick={startAssessment}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              disabled={backendStatus !== 'connected'}
            >
              Start Health Assessment
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3"
              onClick={() => window.location.href = '/providers'}
            >
              Find Healthcare Providers
            </Button>
          </div>

          {backendStatus === 'disconnected' && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-red-800 text-sm">
                <strong>Backend Not Running:</strong> To use the assessment features, please start the FastAPI backend:
              </p>
              <code className="block mt-2 text-xs bg-red-100 p-2 rounded">
                cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
              </code>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900">Why Choose CareLens?</h3>
          <p className="mt-4 text-xl text-gray-600">Advanced AI technology meets healthcare expertise</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Brain className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Advanced machine learning models trained on medical datasets for accurate risk assessment
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Activity className="h-12 w-12 text-green-600 mb-4" />
              <CardTitle>Comprehensive Health Screening</CardTitle>
              <CardDescription>
                Assess risk for diabetes, heart disease, stroke, kidney disease, and other conditions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Care Navigation</CardTitle>
              <CardDescription>
                Find qualified healthcare providers and get personalized recommendations for next steps
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900">How It Works</h3>
            <p className="mt-4 text-xl text-gray-600">Simple, secure, and comprehensive health assessment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Input Health Data</h4>
              <p className="text-gray-600">
                Provide basic health information including demographics, vital signs, medical history, and symptoms
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">AI Analysis</h4>
              <p className="text-gray-600">
                Our advanced ML models analyze your data to assess risk factors for various health conditions
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Get Results & Care</h4>
              <p className="text-gray-600">
                Receive personalized risk scores, recommendations, and connections to appropriate healthcare providers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-blue-400" />
              <h3 className="text-2xl font-bold">CareLens</h3>
            </div>
            <p className="text-gray-400 mb-4">
              AI-Powered Health Risk Assessment Platform
            </p>
            <p className="text-sm text-gray-500">
              © 2024 CareLens. All rights reserved. 
              This platform is for educational and informational purposes only and should not replace professional medical advice.
            </p>
            
            {backendInfo && (
              <div className="mt-4 text-xs text-gray-500">
                Backend Status: {backendInfo.status} | Version: {backendInfo.version || '1.0.0'}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}