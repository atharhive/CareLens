# Frontend-Backend Integration Guide

## Overview
The frontend has been updated to integrate with the FastAPI backend through Next.js API routes that act as proxies. This approach maintains the existing frontend service contracts while connecting to the real backend endpoints.

## Configuration

### Environment Variables
Create a `.env.local` file in the frontend directory with:

```bash
# Set to empty string to use Next.js API routes (which proxy to backend)
# Set to backend URL to call backend directly
NEXT_PUBLIC_API_URL=

# Google Maps API (for provider search)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Important**: Set `NEXT_PUBLIC_API_URL=` (empty) to use the proxy routes, or set it to your backend URL (e.g., `http://localhost:5000`) to call the backend directly.

## API Integration Points

### 1. Assessment Submission
- **Frontend**: Calls `/api/assessment/submit`
- **Backend**: Orchestrates calls to `/ingest/form`, `/detect/`, `/triage/`
- **Data Flow**: Frontend form data → Backend PatientIntakeSchema → Risk detection → Triage → Frontend AssessmentResponse

### 2. Provider Search
- **Frontend**: Calls `/api/providers/search`
- **Backend**: Proxies to `/carefinder/` with query parameters
- **Data Flow**: Frontend search params → Backend coordinates + specialty → Google Maps API → Frontend Provider[]

### 3. Recommendations
- **Frontend**: Calls `/api/recommendations/generate`
- **Backend**: Proxies to `/recommend/` using session_id
- **Data Flow**: Frontend assessmentId → Backend session_id → Personalized recommendations → Frontend Recommendations

### 4. Document Upload
- **Frontend**: Calls `/api/documents/upload`
- **Backend**: Proxies to `/ingest/file`
- **Data Flow**: File upload → Backend storage → File metadata → Frontend UploadedFile

### 5. Document Status
- **Frontend**: Calls `/api/documents/[id]/status`
- **Backend**: Proxies to `/extract/file/{id}/status`
- **Data Flow**: File ID → Backend extraction status → Frontend processing status

### 6. Share Links
- **Frontend**: Calls `/api/share/create`
- **Backend**: Proxies to `/share/create`
- **Data Flow**: Frontend assessmentId → Backend session_id → Shareable link → Frontend share URL

## Backend Requirements

Ensure your backend is running and has these endpoints available:
- `POST /ingest/form` - Patient intake form processing
- `POST /ingest/file` - File upload
- `POST /detect/` - Risk detection
- `POST /triage/` - Urgency classification
- `POST /recommend/` - Personalized recommendations
- `GET /carefinder/` - Provider search
- `POST /share/create` - Share link creation
- `GET /extract/file/{id}/status` - Document processing status

## Testing the Integration

1. **Start Backend**: Ensure your FastAPI backend is running on port 5000
2. **Start Frontend**: Run `npm run dev` in the frontend directory
3. **Set Environment**: Create `.env.local` with `NEXT_PUBLIC_API_URL=`
4. **Test Flow**: 
   - Navigate to `/assessment` and submit a form
   - Check that data flows through to the backend
   - Verify results are returned and displayed

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured to allow frontend origin
2. **API Timeouts**: Check backend is running and accessible
3. **Data Mapping**: Verify frontend types match backend schema expectations

### Debug Mode

Set `NEXT_PUBLIC_DEBUG_MODE=true` in `.env.local` to enable additional logging.

## Architecture Benefits

- **Separation of Concerns**: Frontend services remain unchanged
- **Flexible Routing**: Can easily switch between proxy and direct backend calls
- **Error Handling**: Centralized error handling in API routes
- **Type Safety**: Maintains existing TypeScript interfaces
- **Scalability**: Easy to add caching, rate limiting, or other middleware 