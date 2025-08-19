#!/usr/bin/env python3
"""
Development script to start the FastAPI backend server.
Run this script to start the backend in development mode.
"""
import subprocess
import sys
import os

def start_backend():
    """Start the FastAPI backend with uvicorn."""
    # Ensure we're in the backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    print("🚀 Starting CareLens FastAPI Backend...")
    print(f"📁 Working directory: {backend_dir}")
    print("📚 API Documentation: http://localhost:5000/docs")
    print("")

    try:
        # Start uvicorn server
        cmd = [
            sys.executable, "-m", "uvicorn",
            "app.main:app",
            "--reload",
            "--host", "0.0.0.0",
            "--port", "5000",
            "--log-level", "info"
        ]

        subprocess.run(cmd, check=True)

    except KeyboardInterrupt:
        print("\n👋 Backend server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting backend: {e}")
        return 1
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(start_backend())
