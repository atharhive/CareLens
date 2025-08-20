"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UploadedFile } from "@/types"

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  maxFiles?: number
  acceptedTypes?: string[]
  maxSizeBytes?: number
  className?: string
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 5,
  acceptedTypes = ["application/pdf", "image/jpeg", "image/png"],
  maxSizeBytes = 10 * 1024 * 1024, // 10MB
  className,
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files)
      processFiles(files)
    },
    [maxFiles, acceptedTypes, maxSizeBytes],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      processFiles(files)
    },
    [maxFiles, acceptedTypes, maxSizeBytes],
  )

  const processFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!acceptedTypes.includes(file.type)) return false
      if (file.size > maxSizeBytes) return false
      return true
    })

    const newUploadedFiles: UploadedFile[] = validFiles.slice(0, maxFiles - uploadedFiles.length).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      processingStatus: "pending",
    }))

    const updatedFiles = [...uploadedFiles, ...newUploadedFiles]
    setUploadedFiles(updatedFiles)
    onFilesUploaded(updatedFiles)

    // Simulate processing
    newUploadedFiles.forEach((file) => {
      setTimeout(() => {
        setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, processingStatus: "processing" } : f)))
      }, 500)

      setTimeout(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  processingStatus: "completed",
                  extractedData: [
                    {
                      testName: "Glucose",
                      value: 95,
                      unit: "mg/dL",
                      referenceRange: "70-100",
                      confidence: 0.95,
                    },
                  ],
                }
              : f,
          ),
        )
      }, 3000)
    })
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter((file) => file.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesUploaded(updatedFiles)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <File className="h-4 w-4 text-muted-foreground" />
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Zone */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Upload className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Upload Lab Reports</h3>
          <p className="text-sm text-muted-foreground mb-4">Drag and drop your files here, or click to browse</p>
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="file-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supports PDF, JPEG, PNG up to {formatFileSize(maxSizeBytes)}
          </p>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file) => (
            <Card key={file.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(file.processingStatus)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {file.processingStatus}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {file.processingStatus === "processing" && (
                <div className="mt-2">
                  <Progress value={66} className="h-1" />
                  <p className="text-xs text-muted-foreground mt-1">Extracting lab values...</p>
                </div>
              )}

              {file.processingStatus === "completed" && file.extractedData && (
                <div className="mt-3 p-2 bg-green-50 rounded-md">
                  <p className="text-xs font-medium text-green-800 mb-1">Extracted Values:</p>
                  {file.extractedData.map((data, index) => (
                    <div key={index} className="text-xs text-green-700">
                      {data.testName}: {data.value} {data.unit} (Confidence: {Math.round(data.confidence * 100)}%)
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
