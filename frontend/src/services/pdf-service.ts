"use client"

import * as pdfjsLib from "pdfjs-dist"

// Configure PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export interface PDFPageInfo {
  pageNumber: number
  canvas: HTMLCanvasElement
  text: string
}

export class PDFService {
  // Load and render PDF document
  static async loadPDF(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      return pdf
    } catch (error) {
      console.error("Failed to load PDF:", error)
      throw new Error("Failed to load PDF document")
    }
  }

  // Render PDF page to canvas
  static async renderPage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number, scale = 1.5): Promise<HTMLCanvasElement> {
    try {
      const page = await pdf.getPage(pageNumber)
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement("canvas")
      const context = canvas.getContext("2d")

      if (!context) {
        throw new Error("Failed to get canvas context")
      }

      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      await page.render(renderContext).promise
      return canvas
    } catch (error) {
      console.error("Failed to render PDF page:", error)
      throw new Error(`Failed to render page ${pageNumber}`)
    }
  }

  // Extract text from PDF page
  static async extractTextFromPage(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> {
    try {
      const page = await pdf.getPage(pageNumber)
      const textContent = await page.getTextContent()

      return textContent.items
        .map((item: any) => item.str)
        .join(" ")
        .trim()
    } catch (error) {
      console.error("Failed to extract text from PDF page:", error)
      return ""
    }
  }

  // Process entire PDF document
  static async processPDF(file: File): Promise<PDFPageInfo[]> {
    try {
      const pdf = await this.loadPDF(file)
      const pages: PDFPageInfo[] = []

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const canvas = await this.renderPage(pdf, pageNum)
        const text = await this.extractTextFromPage(pdf, pageNum)

        pages.push({
          pageNumber: pageNum,
          canvas,
          text,
        })
      }

      return pages
    } catch (error) {
      console.error("Failed to process PDF:", error)
      throw new Error("Failed to process PDF document")
    }
  }

  // Search for text in PDF
  static searchInPDF(pages: PDFPageInfo[], searchTerm: string): Array<{ pageNumber: number; matches: number }> {
    const results: Array<{ pageNumber: number; matches: number }> = []

    pages.forEach((page) => {
      const regex = new RegExp(searchTerm, "gi")
      const matches = page.text.match(regex)
      if (matches && matches.length > 0) {
        results.push({
          pageNumber: page.pageNumber,
          matches: matches.length,
        })
      }
    })

    return results
  }
}
