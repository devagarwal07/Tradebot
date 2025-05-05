#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ "$1" == "--force" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Create .env file for production (if needed)
if [ ! -f ".env" ]; then
  echo "Creating .env file..."
  echo "NODE_ENV=production" > .env
  echo "SERVER_MODE=serverless" >> .env
fi

# Build the frontend
echo "Building frontend..."
npm run build

# Prepare for Vercel deployment
echo "Preparing for Vercel deployment..."

# Ensure client/dist directory exists
if [ ! -d "client/dist" ]; then
  echo "Error: client/dist directory not found. Build may have failed."
  exit 1
fi

# Copy built assets to the deployment directory
echo "Copying static assets..."
mkdir -p .vercel/output/static
cp -r client/dist/* .vercel/output/static/

# Create the Vercel output configuration
echo "Creating Vercel output configuration..."
cat > .vercel/output/config.json << EOF
{
  "version": 3,
  "routes": [
    { "src": "/api/(.*)", "dest": "/api" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "NODE_ENV": "production",
    "SERVER_MODE": "serverless"
  }
}
EOF

echo "Build completed successfully!"
