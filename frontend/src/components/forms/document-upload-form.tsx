"use client"

import { FileUpload } from "@/components/ui/custom/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIntakeStore } from "@/stores/intake-store"
import { FileText, ImageIcon, AlertCircle } from "lucide-react"

export function DocumentUploadForm() {
  const { uploadedFiles, setUploadedFiles } = useIntakeStore()

  const completedFiles = uploadedFiles.filter((f) => f.processingStatus === "completed")
  const processingFiles = uploadedFiles.filter((f) => f.processingStatus === "processing")
  const errorFiles = uploadedFiles.filter((f) => f.processingStatus === "error")

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Lab Reports & Medical Documents</h3>
          <p className="text-sm text-muted-foreground">
            Upload recent lab reports, test results, or medical documents to improve assessment accuracy. Our AI will
            extract relevant values automatically.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Lab Reports</p>
              <p className="text-xs text-muted-foreground">Blood work, urine tests</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Medical Images</p>
              <p className="text-xs text-muted-foreground">X-rays, scans, photos</p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="pt-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium">Test Results</p>
              <p className="text-xs text-muted-foreground">EKG, stress tests</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* File Upload Component */}
      <FileUpload
        onFilesUploaded={setUploadedFiles}
        maxFiles={5}
        acceptedTypes={["application/pdf", "image/jpeg", "image/png", "image/tiff"]}
        maxSizeBytes={10 * 1024 * 1024} // 10MB
      />

      {/* Processing Status */}
      {(completedFiles.length > 0 || processingFiles.length > 0 || errorFiles.length > 0) && (
        <div className="space-y-4">
          {/* Successfully processed files */}
          {completedFiles.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800">
                  Successfully Processed ({completedFiles.length})
                </CardTitle>
                <CardDescription className="text-green-700">
                  Lab values have been extracted and will be included in your assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {completedFiles.map((file) => (
                    <div key={file.id} className="bg-white rounded-md p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">{file.name}</p>
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          Processed
                        </Badge>
                      </div>
                      {file.extractedData && file.extractedData.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-green-800">Extracted values:</p>
                          {file.extractedData.map((data, index) => (
                            <div key={index} className="text-xs text-green-700 bg-green-100 rounded px-2 py-1">
                              <span className="font-medium">{data.testName}:</span> {data.value} {data.unit}
                              <span className="ml-2 text-green-600">
                                ({Math.round(data.confidence * 100)}% confidence)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files with errors */}
          {errorFiles.length > 0 && (
            <Card className="bg-red-50 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Processing Errors ({errorFiles.length})
                </CardTitle>
                <CardDescription className="text-red-700">
                  These files could not be processed. Please try uploading again or use a different format.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {errorFiles.map((file) => (
                    <div key={file.id} className="bg-white rounded-md p-3">
                      <p className="font-medium text-sm text-red-800">{file.name}</p>
                      <p className="text-xs text-red-600">
                        Unable to extract data. Please ensure the document is clear and readable.
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-md">
        <p className="font-medium mb-2">Document upload guidelines:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Upload recent lab reports (within the last 6 months) for best accuracy</li>
          <li>Ensure documents are clear and readable</li>
          <li>Supported formats: PDF, JPEG, PNG, TIFF (max 10MB each)</li>
          <li>All uploaded documents are processed securely and deleted after analysis</li>
          <li>This step is optional - you can proceed without uploading documents</li>
        </ul>
      </div>
    </div>
  )
}
