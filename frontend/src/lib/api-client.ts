import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from "axios"

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"
const API_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    }

    // Add request ID for tracking
    config.headers["X-Request-ID"] = Math.random().toString(36).substr(2, 9)

    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error("[API] Request error:", error)
    return Promise.reject(error)
  },
)

// Response interceptor with retry logic
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[API] ${response.status} ${response.config.url}`)
    return response
  },
  async (error) => {
    const config = error.config

    // Don't retry if no config or already retried max times
    if (!config || config.__retryCount >= MAX_RETRIES) {
      console.error("[API] Response error (max retries exceeded):", error.message)
      return Promise.reject(error)
    }

    // Initialize retry count
    config.__retryCount = config.__retryCount || 0
    config.__retryCount += 1

    // Only retry on network errors or 5xx server errors
    const shouldRetry =
      !error.response || (error.response.status >= 500 && error.response.status < 600) || error.code === "ECONNABORTED"

    if (shouldRetry) {
      console.log(`[API] Retrying request (${config.__retryCount}/${MAX_RETRIES}):`, config.url)

      // Wait before retrying (exponential backoff)
      const delay = RETRY_DELAY * Math.pow(2, config.__retryCount - 1)
      await new Promise((resolve) => setTimeout(resolve, delay))

      return apiClient(config)
    }

    console.error("[API] Response error:", error.message)
    return Promise.reject(error)
  },
)

// API response wrapper
interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

// API error class
export class ApiError extends Error {
  public status: number
  public code: string

  constructor(message: string, status = 500, code = "API_ERROR") {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
  }
}

// Generic API request function
async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient(config)
    const apiResponse: ApiResponse<T> = response.data

    if (!apiResponse.success) {
      throw new ApiError(apiResponse.message || "API request failed", response.status)
    }

    return apiResponse.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500
      const message = error.response?.data?.message || error.message || "Network error occurred"
      throw new ApiError(message, status, error.code || "NETWORK_ERROR")
    }
    throw error
  }
}

// Export API client and utilities
export { apiClient, apiRequest, type ApiResponse }
