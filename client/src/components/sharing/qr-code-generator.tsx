"use client"

import { useState, useEffect } from "react"
import { QRService, type QRCodeOptions } from "@/src/services/qr-service"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  defaultText?: string
  title?: string
  onGenerated?: (qrCode: string) => void
  className?: string
}

export function QRCodeGenerator({
  defaultText = "",
  title = "QR Code Generator",
  onGenerated,
  className,
}: QRCodeGeneratorProps) {
  const [text, setText] = useState(defaultText)
  const [qrCode, setQrCode] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [options, setOptions] = useState<QRCodeOptions>({
    width: 256,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#059669",
      light: "#FFFFFF",
    },
  })
  const { toast } = useToast()

  useEffect(() => {
    if (defaultText) {
      generateQRCode()
    }
  }, [defaultText])

  const generateQRCode = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    try {
      const qrDataUrl = await QRService.generateQRCode(text, options)
      setQrCode(qrDataUrl)
      onGenerated?.(qrDataUrl)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCode) return

    const link = document.createElement("a")
    link.download = "qr-code.png"
    link.href = qrCode
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Downloaded",
      description: "QR code has been downloaded successfully.",
    })
  }

  const copyToClipboard = async () => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "Text has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const shareQRCode = async () => {
    if (!qrCode || !navigator.share) {
      toast({
        title: "Error",
        description: "Sharing is not supported on this device.",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert data URL to blob
      const response = await fetch(qrCode)
      const blob = await response.blob()
      const file = new File([blob], "qr-code.png", { type: "image/png" })

      await navigator.share({
        title: "QR Code",
        text: "Scan this QR code",
        files: [file],
      })

      toast({
        title: "Shared",
        description: "QR code has been shared successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share QR code.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">Generate a QR code to share your assessment results</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="qr-text" className="block text-sm font-medium text-gray-700 mb-2">
            Text or URL to encode
          </label>
          <textarea
            id="qr-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text or URL to generate QR code..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="qr-size" className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <select
              id="qr-size"
              value={options.width}
              onChange={(e) => setOptions({ ...options, width: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={128}>Small (128px)</option>
              <option value={256}>Medium (256px)</option>
              <option value={512}>Large (512px)</option>
            </select>
          </div>

          <div>
            <label htmlFor="qr-error-level" className="block text-sm font-medium text-gray-700 mb-1">
              Error Correction
            </label>
            <select
              id="qr-error-level"
              value={options.errorCorrectionLevel}
              onChange={(e) => setOptions({ ...options, errorCorrectionLevel: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="L">Low</option>
              <option value="M">Medium</option>
              <option value="Q">Quartile</option>
              <option value="H">High</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateQRCode}
          disabled={!text.trim() || isGenerating}
          className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? "Generating..." : "Generate QR Code"}
        </button>
      </div>

      {qrCode && (
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
            <img
              src={qrCode || "/placeholder.svg"}
              alt="Generated QR Code"
              className="mx-auto"
              style={{ width: options.width, height: options.width }}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={downloadQRCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Download
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Copy Text
            </button>
            {navigator.share && (
              <button
                onClick={shareQRCode}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Share
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
