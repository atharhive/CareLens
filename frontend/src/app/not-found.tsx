"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Search, FileText, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            {/* 404 Number */}
            <div className="mb-6">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                404
              </h1>
            </div>

            {/* Error Message */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Page Not Found
              </h2>
              <p className="text-gray-600">
                Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3 mb-8">
              <Link href="/" className="block">
                <Button className="w-full" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              
              <Link href="/providers" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Find Providers
                </Button>
              </Link>
              
              <Link href="/assessment" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  <FileText className="h-4 w-4 mr-2" />
                  Health Assessment
                </Button>
              </Link>
            </div>

            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@carelens.ai" className="text-blue-600 hover:underline">
              support@carelens.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  )
} 