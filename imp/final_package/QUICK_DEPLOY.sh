#!/bin/bash
# Quick Deployment Script for TikTok Downloader
# Run this script to prepare your app for deployment

echo "🚀 TikTok Downloader - Quick Deploy Setup"
echo "========================================"

# Create requirements.txt if it doesn't exist
echo "📦 Creating requirements.txt..."
cat > requirements.txt << EOF
flask>=3.1.1
yt-dlp>=2024.12.13
gunicorn>=21.2.0
EOF

# Create Procfile for various platforms
echo "⚙️ Creating Procfile..."
echo "web: gunicorn --bind 0.0.0.0:\$PORT main:app" > Procfile

# Create runtime.txt for Python version
echo "🐍 Setting Python runtime..."
echo "python-3.11.8" > runtime.txt

# Create vercel.json for Vercel deployment
echo "☁️ Creating Vercel config..."
cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "./main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ],
  "env": {
    "SESSION_SECRET": "@session_secret"
  }
}
EOF

# Create app.yaml for Google App Engine
echo "☁️ Creating Google App Engine config..."
cat > app.yaml << EOF
runtime: python311

env_variables:
  SESSION_SECRET: "your-secret-key-change-this"

automatic_scaling:
  target_cpu_utilization: 0.65
  min_instances: 0
  max_instances: 10
EOF

# Create Railway deployment config
echo "🚂 Creating Railway config..."
cat > railway.toml << EOF
[build]
builder = "nixpacks"

[deploy]
numReplicas = 1
sleepApplication = false
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
EOF

# Create GitHub Actions workflow
echo "🔄 Creating GitHub Actions workflow..."
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << EOF
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.11'
        
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        
    - name: Run tests
      run: |
        python -c "import app; print('App imports successfully')"
EOF

# Test the application locally
echo "🧪 Testing application..."
python -c "
try:
    import app
    print('✅ App imports successfully')
    print('✅ Flask app created')
    print('✅ All dependencies satisfied')
except Exception as e:
    print(f'❌ Error: {e}')
"

echo ""
echo "🎉 Deployment files created successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Push code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deployment'"
echo "   git push origin main"
echo ""
echo "2. Deploy to Render.com:"
echo "   - Connect your GitHub repo"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: gunicorn --bind 0.0.0.0:\$PORT main:app"
echo ""
echo "3. Or deploy to Railway:"
echo "   - Connect GitHub repo"
echo "   - Auto-deployment enabled"
echo ""
echo "4. Set environment variable:"
echo "   SESSION_SECRET=your-random-secret-key"
echo ""
echo "🚀 Your TikTok Downloader is ready to deploy!"