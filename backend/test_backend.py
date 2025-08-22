#!/usr/bin/env python3
"""
Simple backend test script to verify the API is working.
Run this from the backend directory to test basic functionality.
"""

import requests
import json

def test_backend():
    """Test basic backend functionality."""
    
    base_url = "http://localhost:5000"
    
    print("🧪 Testing Backend API...")
    print("=" * 50)
    
    # Test 1: Health check
    print("\n1️⃣ Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health/")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("   ✅ Health check successful")
        else:
            print("   ❌ Health check failed")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: CORS test endpoint
    print("\n2️⃣ Testing CORS Endpoint...")
    try:
        response = requests.get(f"{base_url}/health/cors-test")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}...")
        
        if response.status_code == 200:
            print("   ✅ CORS test successful")
        else:
            print("   ❌ CORS test failed")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Provider search (mock data)
    print("\n3️⃣ Testing Provider Search...")
    try:
        params = {
            "lat": 22.743760187586588,
            "lng": 75.87759923011666,
            "specialty": "primary_care",
            "radius_km": 40,
            "max_results": 50,
            "language": "en"
        }
        
        response = requests.get(f"{base_url}/carefinder/", params=params)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:300]}...")
        
        if response.status_code == 200:
            print("   ✅ Provider search successful")
            # Parse response to see if we got providers
            try:
                data = response.json()
                providers_count = len(data.get("providers", []))
                print(f"   📊 Found {providers_count} providers")
            except:
                print("   ⚠️ Response not valid JSON")
        else:
            print("   ❌ Provider search failed")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: CORS headers check
    print("\n4️⃣ Testing CORS Headers...")
    try:
        headers = {"Origin": "http://localhost:3000"}
        response = requests.get(f"{base_url}/health/cors-test", headers=headers)
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers")
        }
        
        print(f"   CORS Headers: {cors_headers}")
        
        if cors_headers["Access-Control-Allow-Origin"]:
            print("   ✅ CORS headers present")
        else:
            print("   ❌ CORS headers missing")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Backend Test...")
    print("Make sure your backend is running on port 5000")
    print("=" * 50)
    
    try:
        test_backend()
        print("\n✅ Backend test completed!")
        
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}") 