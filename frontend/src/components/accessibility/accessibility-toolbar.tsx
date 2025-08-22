"use client"

import { useAccessibility } from "@/hooks/use-accessibility"
import { Button } from "@/components/ui/button"

export function AccessibilityToolbar() {
  const { settings, updateSetting, announceToScreenReader, mounted } = useAccessibility()

  const handleFontSizeChange = (size: typeof settings.fontSize) => {
    updateSetting("fontSize", size)
    announceToScreenReader(`Font size changed to ${size}`)
  }

  const handleHighContrastToggle = () => {
    const newValue = !settings.highContrast
    updateSetting("highContrast", newValue)
    announceToScreenReader(`High contrast mode ${newValue ? "enabled" : "disabled"}`)
  }

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="accessibility-toolbar bg-gray-50 border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Accessibility:</span>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="accessibility-toolbar bg-gray-50 border-b border-gray-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Accessibility:</span>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Font Size:</span>
            <div className="flex gap-1">
              {(["small", "medium", "large", "extra-large"] as const).map((size) => (
                <Button
                  key={size}
                  variant={settings.fontSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFontSizeChange(size)}
                  aria-pressed={settings.fontSize === size}
                  className="text-xs"
                >
                  {size === "small" && "A"}
                  {size === "medium" && "A"}
                  {size === "large" && "A"}
                  {size === "extra-large" && "A"}
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant={settings.highContrast ? "default" : "outline"}
            size="sm"
            onClick={handleHighContrastToggle}
            aria-pressed={settings.highContrast}
          >
            High Contrast
          </Button>

          <div className="text-xs text-gray-500">Press Tab to navigate, Enter to activate</div>
        </div>
      </div>
    </div>
  )
}
