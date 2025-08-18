"use client"

import { useState, useCallback } from "react"
import { ApiError } from "@/src/lib/api-client"

interface UseApiErrorReturn {
  error: string | null
  isError: boolean
  setError: (error: string | null) => void
  clearError: () => void
  handleApiError: (error: unknown) => void
}

export function useApiError(): UseApiErrorReturn {
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleApiError = useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      setError(error.message)
    } else if (error instanceof Error) {
      setError(error.message)
    } else {
      setError("An unexpected error occurred")
    }
  }, [])

  return {
    error,
    isError: error !== null,
    setError,
    clearError,
    handleApiError,
  }
}
