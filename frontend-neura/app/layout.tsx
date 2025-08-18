import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { SkipNavigation } from "@/src/components/accessibility/skip-navigation"
import { AccessibilityToolbar } from "@/src/components/accessibility/accessibility-toolbar"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "HealthAssess AI - Medical Risk Assessment Platform",
  description:
    "AI-powered health risk assessment platform that detects early health risks, connects users with care providers, and provides personalized health guidance.",
  keywords: "health assessment, medical AI, risk detection, healthcare, telemedicine",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <SkipNavigation />
        <AccessibilityToolbar />
        <main id="main-content" role="main">
          {children}
        </main>
      </body>
    </html>
  )
}
