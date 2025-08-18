"use client"

import { useState, useEffect, useCallback } from "react"

interface AccessibilitySettings {
  highContrast: boolean
  fontSize: "small" | "medium" | "large" | "extra-large"
  reducedMotion: boolean
  screenReader: boolean
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    fontSize: "medium",
    reducedMotion: false,
    screenReader: false,
  })

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem("accessibility-settings")
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to parse accessibility settings:", error)
      }
    }

    // Detect system preferences
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)")

    setSettings((prev) => ({
      ...prev,
      reducedMotion: prefersReducedMotion.matches,
      highContrast: prev.highContrast || prefersHighContrast.matches,
    }))

    // Listen for changes
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, reducedMotion: e.matches }))
    }

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setSettings((prev) => ({ ...prev, highContrast: prev.highContrast || e.matches }))
    }

    prefersReducedMotion.addEventListener("change", handleMotionChange)
    prefersHighContrast.addEventListener("change", handleContrastChange)

    return () => {
      prefersReducedMotion.removeEventListener("change", handleMotionChange)
      prefersHighContrast.removeEventListener("change", handleContrastChange)
    }
  }, [])

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement

    // High contrast mode
    if (settings.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Font size
    root.classList.remove("font-small", "font-medium", "font-large", "font-extra-large")
    root.classList.add(`font-${settings.fontSize}`)

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduce-motion")
    } else {
      root.classList.remove("reduce-motion")
    }

    // Save to localStorage
    localStorage.setItem("accessibility-settings", JSON.stringify(settings))
  }, [settings])

  const updateSetting = useCallback(
    <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const announceToScreenReader = useCallback((message: string) => {
    const announcement = document.createElement("div")
    announcement.setAttribute("aria-live", "polite")
    announcement.setAttribute("aria-atomic", "true")
    announcement.className = "sr-only"
    announcement.textContent = message

    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }, [])

  return {
    settings,
    updateSetting,
    announceToScreenReader,
  }
}
