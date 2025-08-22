#!/usr/bin/env python3
"""
Simple CORS test script to verify backend CORS configuration.
Run this from the backend directory to test CORS functionality.
"""

import requests
import json

def test_cors():
    """Test CORS functionality with different origins."""
    
    # Test URLs
    base_url = "http://localhost:5000"
    test_endpoints = [
        "/health/",
        "/health/cors-test",
        "/carefinder/specialties"
    ]
    
    # Test origins
    test_origins = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    print("🧪 Testing CORS Configuration...")
    print("=" * 50)
    
    for endpoint in test_endpoints:
        print(f"\n📍 Testing endpoint: {endpoint}")
        
        for origin in test_origins:
            try:
                # Test preflight request
                headers = {
                    "Origin": origin,
                    "Access-Control-Request-Method": "GET",
                    "Access-Control-Request-Headers": "Content-Type"
                }
                
                preflight_response = requests.options(f"{base_url}{endpoint}", headers=headers)
                
                print(f"  🔍 Origin: {origin}")
                print(f"     Preflight Status: {preflight_response.status_code}")
                print(f"     CORS Headers: {dict(preflight_response.headers)}")
                
                # Test actual request
                headers = {"Origin": origin}
                response = requests.get(f"{base_url}{endpoint}", headers=headers)
                
                print(f"     GET Status: {response.status_code}")
                print(f"     Response Headers: {dict(response.headers)}")
                
                if response.status_code == 200:
                    print(f"     ✅ Success")
                else:
                    print(f"     ❌ Failed: {response.text[:100]}")
                    
            except requests.exceptions.RequestException as e:
                print(f"  ❌ Error testing {origin}: {e}")
        
        print("-" * 30)

def test_simple_request():
    """Test a simple request without CORS headers."""
    print("\n🧪 Testing Simple Request...")
    print("=" * 50)
    
    try:
        response = requests.get("http://localhost:5000/health/cors-test")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Simple request successful")
        else:
            print("❌ Simple request failed")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting CORS Test...")
    print("Make sure your backend is running on port 5000")
    print("=" * 50)
    
    try:
        test_simple_request()
        test_cors()
        print("\n✅ CORS test completed!")
        
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}") 