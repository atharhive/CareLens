"use client"

import QRCode from "qrcode"

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
}

export class QRService {
  // Generate QR code as data URL
  static async generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const defaultOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M" as const,
        ...options,
      }

      const dataUrl = await QRCode.toDataURL(text, defaultOptions)
      return dataUrl
    } catch (error) {
      console.error("Failed to generate QR code:", error)
      throw new Error("Failed to generate QR code")
    }
  }

  // Generate QR code as SVG string
  static async generateQRCodeSVG(text: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const defaultOptions = {
        width: 256,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M" as const,
        ...options,
      }

      const svg = await QRCode.toString(text, { type: "svg", ...defaultOptions })
      return svg
    } catch (error) {
      console.error("Failed to generate QR code SVG:", error)
      throw new Error("Failed to generate QR code SVG")
    }
  }

  // Generate QR code for sharing assessment results
  static async generateShareQR(shareUrl: string, options: QRCodeOptions = {}): Promise<string> {
    const qrOptions = {
      width: 200,
      margin: 1,
      color: {
        dark: "#059669", // Primary color
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H" as const, // High error correction for sharing
      ...options,
    }

    return this.generateQRCode(shareUrl, qrOptions)
  }

  // Generate QR code for provider contact
  static async generateContactQR(provider: { name: string; phone: string; website?: string }): Promise<string> {
    // Create vCard format
    const vCard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${provider.name}`,
      `TEL:${provider.phone}`,
      provider.website ? `URL:${provider.website}` : "",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\n")

    return this.generateQRCode(vCard, {
      width: 200,
      errorCorrectionLevel: "H",
    })
  }

  // Generate QR code for appointment booking
  static async generateAppointmentQR(appointmentData: {
    provider: string
    date: string
    time: string
    location: string
  }): Promise<string> {
    // Create calendar event format
    const eventData = [
      "BEGIN:VEVENT",
      `SUMMARY:Medical Appointment with ${appointmentData.provider}`,
      `DTSTART:${appointmentData.date}T${appointmentData.time}`,
      `LOCATION:${appointmentData.location}`,
      "END:VEVENT",
    ].join("\n")

    return this.generateQRCode(eventData, {
      width: 200,
      errorCorrectionLevel: "H",
    })
  }
}
