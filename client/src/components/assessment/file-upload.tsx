import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { assessmentApi } from "@/lib/api";
import { useAssessmentStore } from "@/store/assessment";
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X,
  FileText,
  Image as ImageIcon,
  Loader2
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  extractedData?: Record<string, any>;
  confidenceScores?: Record<string, number>;
}

export default function FileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const { sessionId, addUploadedFile } = useAssessmentStore();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!sessionId) {
        throw new Error('No session ID available');
      }
      return assessmentApi.uploadFile(sessionId, file);
    },
    onSuccess: (data, file) => {
      setFiles(prev => 
        prev.map(f => 
          f.name === file.name 
            ? { 
                ...f, 
                id: data.file_id,
                status: data.processing_status as any,
                progress: 100,
                extractedData: data.extracted_data,
                confidenceScores: data.confidence_scores
              }
            : f
        )
      );
      addUploadedFile(data.file_id);
      toast({
        title: "File uploaded successfully",
        description: "Processing lab results...",
      });
    },
    onError: (error, file) => {
      setFiles(prev => 
        prev.map(f => 
          f.name === file.name 
            ? { ...f, status: 'failed', progress: 0 }
            : f
        )
      );
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
      };

      setFiles(prev => [...prev, newFile]);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => 
          prev.map(f => 
            f.name === file.name && f.status === 'uploading'
              ? { ...f, progress: Math.min(f.progress + 20, 90) }
              : f
          )
        );
      }, 200);

      uploadMutation.mutate(file);

      setTimeout(() => {
        clearInterval(progressInterval);
      }, 1000);
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return ImageIcon;
    return File;
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return 'text-medical-green';
      case 'failed': return 'text-red-500';
      case 'processing': return 'text-healthcare-teal';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return AlertCircle;
      case 'processing': 
      case 'uploading': return Loader2;
      default: return File;
    }
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5 text-medical-blue" />
          Upload Lab Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-medical-blue bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-medical-blue font-medium">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Drag & drop lab reports here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, JPG, PNG files up to 10MB
              </p>
            </div>
          )}
        </div>

        {/* Supported Values Info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            We Extract These Values:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
            <div>• HbA1c, Glucose</div>
            <div>• Cholesterol Panel</div>
            <div>• Kidney Function</div>
            <div>• Liver Function</div>
            <div>• Blood Count</div>
            <div>• Thyroid (TSH)</div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">
              Uploaded Files ({files.length})
            </h4>
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              const StatusIcon = getStatusIcon(file.status);
              const statusColor = getStatusColor(file.status);

              return (
                <div key={file.name} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <FileIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center ml-2">
                            <StatusIcon 
                              className={`h-4 w-4 ${statusColor} ${
                                file.status === 'uploading' || file.status === 'processing' 
                                  ? 'animate-spin' 
                                  : ''
                              }`} 
                            />
                            <Badge 
                              variant="secondary" 
                              className={`ml-2 ${
                                file.status === 'completed' 
                                  ? 'bg-medical-green/10 text-medical-green border-medical-green/20' 
                                  : file.status === 'failed'
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : 'bg-healthcare-teal/10 text-healthcare-teal border-healthcare-teal/20'
                              }`}
                            >
                              {file.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                        
                        {(file.status === 'uploading' || file.status === 'processing') && (
                          <Progress value={file.progress} className="mt-2" />
                        )}

                        {/* Extracted Data Preview */}
                        {file.status === 'completed' && file.extractedData && (
                          <div className="mt-2 text-xs">
                            <div className="text-gray-600 dark:text-gray-300 mb-1">
                              Extracted values:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(file.extractedData).slice(0, 4).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-xs">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                              {Object.keys(file.extractedData).length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{Object.keys(file.extractedData).length - 4} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.name)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Manual Entry Option */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Don't have digital reports?
          </p>
          <Button variant="outline" size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Enter Values Manually
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
