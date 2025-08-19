"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HIPAANotice() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          HIPAA Privacy Notice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-blue-800">
            Your health information is protected under HIPAA regulations. This assessment tool:
          </p>
          <ul className="text-sm text-blue-800 space-y-1 ml-4">
            <li>• Does not store personal health information permanently</li>
            <li>• Uses encrypted connections for data transmission</li>
            <li>• Provides results for informational purposes only</li>
            <li>• Is not a substitute for professional medical advice</li>
          </ul>

          {isExpanded && (
            <div className="mt-4 p-4 bg-white rounded-md border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Your Rights Under HIPAA:</h4>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Right to access your health information</li>
                <li>• Right to request corrections to your health information</li>
                <li>• Right to request restrictions on use or disclosure</li>
                <li>• Right to request confidential communications</li>
                <li>• Right to file a complaint if you believe your privacy rights have been violated</li>
              </ul>

              <h4 className="font-semibold text-blue-900 mt-4 mb-2">Data Security:</h4>
              <p className="text-sm text-blue-800">
                All data is encrypted in transit and at rest. We use industry-standard security measures to protect your
                information. Assessment data is automatically deleted after 30 days unless you choose to save results to
                your account.
              </p>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
            aria-expanded={isExpanded}
            aria-controls="hipaa-details"
          >
            {isExpanded ? "Show Less" : "Read Full Notice"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
