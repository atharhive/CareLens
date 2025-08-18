import express from "express";
import { createServer } from "http";
import cors from "cors";
import path from "path";

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Development server running" });
});

// Proxy API calls to the FastAPI backend
app.use("/api", (req, res) => {
  res.status(503).json({ 
    error: "Backend not running", 
    message: "FastAPI backend is not started. Please run the backend separately.",
    backend_url: "http://localhost:8000",
    instructions: "cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
  });
});

// Serve a simple landing page with instructions
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CareLens Development Server</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                max-width: 800px; 
                margin: 50px auto; 
                padding: 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                line-height: 1.6;
            }
            .container { 
                background: rgba(255,255,255,0.1); 
                padding: 40px; 
                border-radius: 15px; 
                backdrop-filter: blur(10px);
            }
            h1 { color: #fff; margin-bottom: 30px; }
            .status { 
                background: rgba(255,255,255,0.2); 
                padding: 15px; 
                border-radius: 8px; 
                margin: 20px 0; 
            }
            .command { 
                background: rgba(0,0,0,0.3); 
                padding: 10px; 
                border-radius: 5px; 
                font-family: 'Courier New', monospace; 
                margin: 10px 0; 
            }
            .section { margin: 30px 0; }
            a { color: #90cdf4; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .heart { color: #ff6b6b; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1><span class="heart">❤️</span> CareLens Development Server</h1>
            
            <div class="status">
                <strong>📡 Server Status:</strong> Development proxy running on port 5000
            </div>
            
            <div class="section">
                <h2>🚀 To Start the Full Application:</h2>
                
                <h3>Option 1: Start Both Services</h3>
                <p><strong>Frontend (Next.js):</strong></p>
                <div class="command">cd client && npm run dev</div>
                <p>Access at: <a href="http://localhost:3000" target="_blank">http://localhost:3000</a></p>
                
                <p><strong>Backend (FastAPI):</strong></p>
                <div class="command">cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000</div>
                <p>Access at: <a href="http://localhost:8000" target="_blank">http://localhost:8000</a></p>
                <p>API Docs: <a href="http://localhost:8000/docs" target="_blank">http://localhost:8000/docs</a></p>
            </div>
            
            <div class="section">
                <h2>📋 Setup Checklist:</h2>
                <p>✅ Project structure created</p>
                <p>✅ Configuration files ready</p>
                <p>⚠️ Frontend dependencies: <code>cd client && npm install</code></p>
                <p>⚠️ Backend dependencies: <code>cd backend && pip install -r requirements.txt</code></p>
            </div>
            
            <div class="section">
                <h2>🔗 Quick Links:</h2>
                <p><a href="/api/health">API Health Check</a></p>
                <p><a href="https://github.com/atharhive/CareLens" target="_blank">Project Repository</a></p>
            </div>
            
            <div class="section">
                <h2>📚 Documentation:</h2>
                <p>📖 <strong>Setup Guide:</strong> SETUP.md</p>
                <p>🎨 <strong>Frontend:</strong> client/README.md</p>
                <p>🔧 <strong>Backend:</strong> backend/README.md</p>
            </div>
            
            <div class="section">
                <p><em>CareLens - AI-Powered Health Risk Assessment Platform</em></p>
                <p>This development server provides basic routing and API health checks while you set up the main application services.</p>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Catch-all route for other paths
app.get("*", (req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>CareLens - Page Not Found</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                text-align: center; 
                padding: 50px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                margin: 0;
            }
            .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 40px; 
                background: rgba(255,255,255,0.1); 
                border-radius: 15px; 
                backdrop-filter: blur(10px);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🔍 Page Not Found</h1>
            <p>This is the CareLens development server. The page you're looking for doesn't exist on this server.</p>
            <p><a href="/" style="color: #90cdf4;">← Back to Home</a></p>
            <p>For the full application, please start the frontend server at <strong>localhost:3000</strong></p>
        </div>
    </body>
    </html>
  `);
});

const server = createServer(app);

server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 CareLens Development Server running on http://0.0.0.0:${port}`);
  console.log(`📁 Frontend: Next.js app in ./client/`);
  console.log(`🔧 Backend: FastAPI app in ./backend/`);
  console.log("");
  console.log("🌟 Quick Start:");
  console.log("1. Frontend: cd client && npm run dev");
  console.log("2. Backend:  cd backend && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000");
  console.log("");
  console.log("🔗 Access Points:");
  console.log(`   Development Server: http://localhost:${port}`);
  console.log("   Frontend App: http://localhost:3000 (when started)");
  console.log("   Backend API: http://localhost:8000 (when started)");
});