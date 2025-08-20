"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { LoadingSkeleton } from "@/components/ui/custom/loading-skeleton"
import { PDFService, type PDFPageInfo } from "@/services/pdf-service"
import { ChevronLeft, ChevronRight, Search, Download, ZoomIn, ZoomOut } from "lucide-react"

interface PDFViewerProps {
  file: File
  onTextExtracted?: (text: string) => void
  className?: string
}

export function PDFViewer({ file, onTextExtracted, className }: PDFViewerProps) {
  const [pages, setPages] = useState<PDFPageInfo[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{ pageNumber: number; matches: number }>>([])
  const [scale, setScale] = useState(1.5)

  useEffect(() => {
    loadPDF()
  }, [file])

  useEffect(() => {
    if (pages.length > 0) {
      const allText = pages.map((page) => page.text).join("\n")
      onTextExtracted?.(allText)
    }
  }, [pages, onTextExtracted])

  const loadPDF = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const processedPages = await PDFService.processPDF(file)
      setPages(processedPages)
      setCurrentPage(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const results = PDFService.searchInPDF(pages, searchTerm)
    setSearchResults(results)

    // Jump to first result
    if (results.length > 0) {
      setCurrentPage(results[0].pageNumber - 1)
    }
  }

  const handleDownload = () => {
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading PDF...</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSkeleton variant="form" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadPDF} variant="outline" className="bg-transparent">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentPageData = pages[currentPage]

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            PDF Viewer
            <Badge variant="outline">{file.name}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Found in pages:</span>
            {searchResults.map((result) => (
              <Badge
                key={result.pageNumber}
                variant="outline"
                className="cursor-pointer"
                onClick={() => setCurrentPage(result.pageNumber - 1)}
              >
                Page {result.pageNumber} ({result.matches})
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* PDF Page Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage + 1} of {pages.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage === pages.length - 1}
                className="bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* PDF Page Canvas */}
          <div className="border rounded-md p-4 bg-white overflow-auto max-h-96">
            {currentPageData && (
              <div
                style={{
                  transform: `scale(${scale / 1.5})`,
                  transformOrigin: "top left",
                  width: `${(currentPageData.canvas.width / scale) * 1.5}px`,
                  height: `${(currentPageData.canvas.height / scale) * 1.5}px`,
                }}
              >
                <canvas
                  ref={(canvas) => {
                    if (canvas && currentPageData.canvas) {
                      const ctx = canvas.getContext("2d")
                      if (ctx) {
                        canvas.width = currentPageData.canvas.width
                        canvas.height = currentPageData.canvas.height
                        ctx.drawImage(currentPageData.canvas, 0, 0)
                      }
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Extracted Text Preview */}
          {currentPageData?.text && (
            <Card className="bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Extracted Text (Page {currentPage + 1})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
                  {currentPageData.text.substring(0, 500)}
                  {currentPageData.text.length > 500 && "..."}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
