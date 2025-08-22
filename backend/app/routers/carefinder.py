"""
Care finder router for healthcare provider search and location services.
Google Maps API integration for provider search with filtering capabilities.
"""

import logging
from typing import List, Dict, Any, Optional
from math import radians, cos, sin, asin, sqrt

from fastapi import APIRouter, HTTPException, Query, Depends, Request
from fastapi.responses import JSONResponse
import requests

from app.core.schemas import ProviderLocation, ProviderSearchResponse
from app.core.config import settings
from app.core.security import SecurityManager

logger = logging.getLogger(__name__)
router = APIRouter()

def get_security_manager(request: Request) -> Optional[SecurityManager]:
    """Dependency to get security manager."""
    return getattr(request.app.state, 'security_manager', None)

@router.get("/", response_model=ProviderSearchResponse)
async def find_providers(
    lat: float = Query(..., description="Latitude for search location"),
    lng: float = Query(..., description="Longitude for search location"),
    specialty: str = Query(..., description="Medical specialty to search for"),
    radius_km: int = Query(default=25, ge=1, le=100, description="Search radius in kilometers"),
    max_results: int = Query(default=20, ge=1, le=50, description="Maximum number of results"),
    language: str = Query(default="en", description="Preferred language"),
    request: Request = None,
    security_manager: SecurityManager = Depends(get_security_manager)
):
    """
    Find healthcare providers near a location using Google Maps API.
    
    - Google Maps API integration for provider search
    - Filters by distance, ratings, specialty, and language
    - Returns structured provider information
    - Supports radius-based search with configurable limits
    """
    try:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.info(f"Provider search - Lat: {lat}, Lng: {lng}, Specialty: {specialty}, Request: {request_id}")
        
        # Validate API key is available
        if not settings.GOOGLE_MAPS_API_KEY:
            logger.warning("Google Maps API key not available, using mock data for development")
            # Use mock data for development
            providers = _get_mock_providers(lat, lng, specialty, radius_km, max_results)
        else:
            # Search for healthcare providers using Google Maps API
            providers = await _search_healthcare_providers(
                lat, lng, specialty, radius_km, max_results, language
            )
        
        # Validate coordinates
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            raise HTTPException(
                status_code=400,
                detail="Invalid coordinates provided"
            )
        
        # Sort providers by distance and rating
        sorted_providers = sorted(
            providers,
            key=lambda p: (p.distance_km, -p.rating if p.rating else 0)
        )
        
        # Log security event
        if security_manager:
            security_manager.log_security_event(
                "provider_search_completed",
                {
                    "search_location": {"lat": lat, "lng": lng},
                    "specialty": specialty,
                    "results_count": len(sorted_providers),
                    "radius_km": radius_km
                },
                request_id
            )
        
        response = ProviderSearchResponse(
            providers=sorted_providers,
            search_location={"lat": lat, "lng": lng},
            search_radius_km=radius_km,
            total_found=len(sorted_providers)
        )
        
        logger.info(f"Found {len(sorted_providers)} providers for {specialty} near {lat},{lng}")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Provider search failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to search for healthcare providers"
        )

@router.get("/specialties")
async def get_available_specialties():
    """
    Get list of available medical specialties for provider search.
    
    Returns standardized specialty names and their search terms
    for use with the provider search API.
    """
    try:
        specialties = {
            "primary_care": {
                "name": "Primary Care",
                "search_terms": ["family medicine", "internal medicine", "general practice"],
                "description": "General medical care and preventive services"
            },
            "cardiology": {
                "name": "Cardiology",
                "search_terms": ["cardiologist", "heart doctor"],
                "description": "Heart and cardiovascular conditions"
            },
            "endocrinology": {
                "name": "Endocrinology",
                "search_terms": ["endocrinologist", "diabetes doctor"],
                "description": "Diabetes, thyroid, and hormone disorders"
            },
            "nephrology": {
                "name": "Nephrology",
                "search_terms": ["nephrologist", "kidney doctor"],
                "description": "Kidney diseases and disorders"
            },
            "gastroenterology": {
                "name": "Gastroenterology",
                "search_terms": ["gastroenterologist", "liver doctor"],
                "description": "Digestive system and liver conditions"
            },
            "hematology": {
                "name": "Hematology",
                "search_terms": ["hematologist", "blood doctor"],
                "description": "Blood disorders and diseases"
            },
            "neurology": {
                "name": "Neurology",
                "search_terms": ["neurologist", "stroke doctor"],
                "description": "Brain, nerve, and stroke conditions"
            },
            "emergency": {
                "name": "Emergency Medicine",
                "search_terms": ["emergency room", "urgent care"],
                "description": "Emergency and urgent medical care"
            }
        }
        
        return JSONResponse(content={
            "specialties": specialties,
            "total_specialties": len(specialties),
            "search_tips": [
                "Use specific specialty names for better results",
                "Emergency care should be accessed directly in urgent situations",
                "Consider travel distance and insurance acceptance"
            ]
        })
        
    except Exception as e:
        logger.error(f"Failed to get specialties: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve available specialties"
        )

@router.get("/nearby")
async def find_nearby_facilities(
    lat: float = Query(..., description="Latitude for search location"),
    lng: float = Query(..., description="Longitude for search location"),
    facility_type: str = Query(default="hospital", description="Type of facility to search for"),
    emergency_only: bool = Query(default=False, description="Only return emergency facilities"),
    request: Request = None,
    security_manager: SecurityManager = Depends(get_security_manager)
):
    """
    Find nearby healthcare facilities (hospitals, clinics, urgent care).
    
    Useful for emergency situations or when patients need immediate care
    recommendations based on their location.
    """
    try:
        request_id = getattr(request.state, 'request_id', 'unknown')
        logger.info(f"Facility search - Type: {facility_type}, Emergency: {emergency_only}, Request: {request_id}")
        
        # Validate API key is available
        if not settings.GOOGLE_MAPS_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="Facility search service temporarily unavailable"
            )
        
        # Search for healthcare facilities
        facilities = await _search_healthcare_facilities(
            lat, lng, facility_type, emergency_only
        )
        
        # Sort by distance for emergency situations
        sorted_facilities = sorted(facilities, key=lambda f: f.distance_km)
        
        # Log security event
        security_manager.log_security_event(
            "facility_search_completed",
            {
                "search_location": {"lat": lat, "lng": lng},
                "facility_type": facility_type,
                "emergency_only": emergency_only,
                "results_count": len(sorted_facilities)
            },
            request_id
        )
        
        response = {
            "facilities": [facility.dict() for facility in sorted_facilities],
            "search_location": {"lat": lat, "lng": lng},
            "facility_type": facility_type,
            "emergency_only": emergency_only,
            "nearest_facility": sorted_facilities[0].dict() if sorted_facilities else None
        }
        
        logger.info(f"Found {len(sorted_facilities)} {facility_type} facilities")
        return JSONResponse(content=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Facility search failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to search for healthcare facilities"
        )

async def _search_healthcare_providers(
    lat: float, lng: float, specialty: str, radius_km: int, 
    max_results: int, language: str
) -> List[ProviderLocation]:
    """Search for healthcare providers using Google Places API."""
    providers = []
    
    try:
        # Convert radius to meters for Google API
        radius_meters = min(radius_km * 1000, 50000)  # Google API limit
        
        # Construct search query based on specialty
        specialty_queries = _get_specialty_search_terms(specialty)
        
        for query in specialty_queries:
            # Search using Google Places API
            search_url = "https://maps.googleapis.com/maps/api/place/textsearch/json"
            params = {
                'query': f"{query} near {lat},{lng}",
                'location': f"{lat},{lng}",
                'radius': radius_meters,
                'type': 'doctor',
                'language': language,
                'key': settings.GOOGLE_MAPS_API_KEY
            }
            
            response = requests.get(search_url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                for place in data.get('results', []):
                    if len(providers) >= max_results:
                        break
                    
                    # Calculate distance
                    place_lat = place['geometry']['location']['lat']
                    place_lng = place['geometry']['location']['lng']
                    distance = _calculate_distance(lat, lng, place_lat, place_lng)
                    
                    # Skip if outside radius
                    if distance > radius_km:
                        continue
                    
                    # Get additional details
                    place_details = await _get_place_details(place['place_id'])
                    
                    provider = ProviderLocation(
                        place_id=place['place_id'],
                        name=place['name'],
                        address=place.get('formatted_address', ''),
                        phone=place_details.get('phone'),
                        rating=place.get('rating'),
                        distance_km=round(distance, 2),
                        specialty=specialty,
                        accepts_new_patients=place_details.get('accepts_new_patients'),
                        insurance_accepted=place_details.get('insurance_accepted', [])
                    )
                    
                    providers.append(provider)
            
            if len(providers) >= max_results:
                break
    
    except Exception as e:
        logger.error(f"Provider search API error: {str(e)}")
        # Return empty list rather than failing completely
        
    return providers

async def _search_healthcare_facilities(
    lat: float, lng: float, facility_type: str, emergency_only: bool
) -> List[ProviderLocation]:
    """Search for healthcare facilities using Google Places API."""
    facilities = []
    
    try:
        # Determine search parameters based on facility type
        if emergency_only:
            search_query = "emergency room hospital"
            place_type = "hospital"
        elif facility_type == "hospital":
            search_query = "hospital"
            place_type = "hospital"
        elif facility_type == "urgent_care":
            search_query = "urgent care clinic"
            place_type = "doctor"
        else:
            search_query = "medical clinic"
            place_type = "doctor"
        
        # Search using Google Places Nearby API
        search_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': f"{lat},{lng}",
            'radius': 25000,  # 25km radius
            'type': place_type,
            'keyword': search_query,
            'key': settings.GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            for place in data.get('results', []):
                # Calculate distance
                place_lat = place['geometry']['location']['lat']
                place_lng = place['geometry']['location']['lng']
                distance = _calculate_distance(lat, lng, place_lat, place_lng)
                
                # Get additional details
                place_details = await _get_place_details(place['place_id'])
                
                facility = ProviderLocation(
                    place_id=place['place_id'],
                    name=place['name'],
                    address=place.get('vicinity', ''),
                    phone=place_details.get('phone'),
                    rating=place.get('rating'),
                    distance_km=round(distance, 2),
                    specialty=facility_type,
                    accepts_new_patients=True,  # Assume facilities accept patients
                    insurance_accepted=[]
                )
                
                facilities.append(facility)
    
    except Exception as e:
        logger.error(f"Facility search API error: {str(e)}")
        
    return facilities

async def _get_place_details(place_id: str) -> Dict[str, Any]:
    """Get detailed information about a place using Google Places API."""
    try:
        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': 'formatted_phone_number,website,opening_hours',
            'key': settings.GOOGLE_MAPS_API_KEY
        }
        
        response = requests.get(details_url, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            result = data.get('result', {})
            
            return {
                'phone': result.get('formatted_phone_number'),
                'website': result.get('website'),
                'hours': result.get('opening_hours', {}).get('weekday_text', []),
                'accepts_new_patients': None,  # Not available from Google API
                'insurance_accepted': []  # Not available from Google API
            }
    
    except Exception as e:
        logger.warning(f"Failed to get place details for {place_id}: {str(e)}")
    
    return {}

def _get_specialty_search_terms(specialty: str) -> List[str]:
    """Get search terms for different medical specialties."""
    specialty_terms = {
        "primary_care": ["family medicine doctor", "internal medicine physician", "primary care physician"],
        "cardiology": ["cardiologist", "heart doctor", "cardiovascular specialist"],
        "endocrinology": ["endocrinologist", "diabetes doctor", "hormone specialist"],
        "nephrology": ["nephrologist", "kidney doctor", "kidney specialist"],
        "gastroenterology": ["gastroenterologist", "GI doctor", "digestive specialist"],
        "hematology": ["hematologist", "blood specialist", "cancer doctor"],
        "neurology": ["neurologist", "brain doctor", "stroke specialist"],
        "emergency": ["emergency room", "urgent care", "emergency medicine"],
        "psychiatry": ["psychiatrist", "mental health doctor"],
        "dermatology": ["dermatologist", "skin doctor"],
        "orthopedics": ["orthopedic surgeon", "bone doctor"],
        "ophthalmology": ["eye doctor", "ophthalmologist"],
        "otolaryngology": ["ENT doctor", "ear nose throat specialist"]
    }
    
    return specialty_terms.get(specialty.lower(), [f"{specialty} doctor", f"{specialty} specialist"])

def _calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using Haversine formula."""
    # Convert decimal degrees to radians
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlng/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in kilometers
    km = 6371 * c
    return km

def _get_mock_providers(lat: float, lng: float, specialty: str, radius_km: int, max_results: int) -> List[ProviderLocation]:
    """Mock provider search for development when Google Maps API key is not available."""
    providers = []
    
    # Generate mock providers around the search location
    mock_providers_data = [
        {
            "name": "Mock Primary Care Clinic",
            "address": "123 Mock Ave, Mock City, MO 63105",
            "phone": "555-123-4567",
            "rating": 4.5,
            "distance_km": 1.2,
            "specialty": "primary_care",
            "accepts_new_patients": True,
            "insurance_accepted": ["Blue Cross Blue Shield", "Aetna"]
        },
        {
            "name": "Mock Cardiology Center",
            "address": "456 Mock St, Mock City, MO 63105",
            "phone": "555-234-5678",
            "rating": 3.8,
            "distance_km": 2.5,
            "specialty": "cardiology",
            "accepts_new_patients": True,
            "insurance_accepted": ["Medicare"]
        },
        {
            "name": "Mock Neurology Institute",
            "address": "789 Mock Ln, Mock City, MO 63105",
            "phone": "555-345-6789",
            "rating": 5.0,
            "distance_km": 0.8,
            "specialty": "neurology",
            "accepts_new_patients": True,
            "insurance_accepted": ["United Healthcare"]
        },
        {
            "name": "Mock Family Medicine",
            "address": "321 Mock Dr, Mock City, MO 63105",
            "phone": "555-456-7890",
            "rating": 4.2,
            "distance_km": 3.1,
            "specialty": "primary_care",
            "accepts_new_patients": True,
            "insurance_accepted": ["Cigna", "Humana"]
        },
        {
            "name": "Mock Urgent Care",
            "address": "654 Mock Blvd, Mock City, MO 63105",
            "phone": "555-567-8901",
            "rating": 4.0,
            "distance_km": 1.8,
            "specialty": "urgent_care",
            "accepts_new_patients": True,
            "insurance_accepted": ["All major insurance"]
        }
    ]
    
    for i, mock_data in enumerate(mock_providers_data):
        if len(providers) >= max_results:
            break
            
        # Filter by specialty if specified
        if specialty != "primary_care" and mock_data["specialty"] != specialty:
            continue
            
        # Check if within radius
        if mock_data["distance_km"] <= radius_km:
            provider = ProviderLocation(
                place_id=f"mock_place_{i}",
                name=mock_data["name"],
                address=mock_data["address"],
                phone=mock_data["phone"],
                rating=mock_data["rating"],
                distance_km=mock_data["distance_km"],
                specialty=mock_data["specialty"],
                accepts_new_patients=mock_data["accepts_new_patients"],
                insurance_accepted=mock_data["insurance_accepted"]
            )
            providers.append(provider)
    
    return providers
