#!/bin/bash

# Create static directory structure
echo "Creating static directory structure..."
mkdir -p static/react
mkdir -p static/uploads

# Clean existing static files
echo "Cleaning static directories..."
rm -rf static/react/*

# Build React frontend
echo "Building React frontend..."
cd frontend
npm install
npm run build
cd ..

# Copy build files
echo "Copying build files to static directory..."
cp -r frontend/dist/* static/react/

# Ensure index.html exists and has correct permissions
echo "Verifying static files..."
if [ ! -f "static/react/index.html" ]; then
    echo "Error: index.html not found in build output!"
    exit 1
fi

# Set correct permissions
chmod -R 755 static/
find static/react -type f -exec chmod 644 {} \;

# List files for verification
echo "Static files in react directory:"
ls -la static/react/
echo "Assets directory:"
ls -la static/react/assets/

# Start FastAPI backend
echo "Starting FastAPI backend..."
python3 app.py
