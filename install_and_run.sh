#!/bin/bash

# This script installs dependencies and runs backend and frontend for Peeentrest
# Usage: bash install_and_run.sh

set -e

# Backend setup
echo "\n[1/4] Installing backend dependencies..."
cd peeentrest-backend
if [ -f package.json ]; then
    npm install
else
    echo "No package.json found in backend. Skipping npm install."
fi
cd ..

# Frontend setup
echo "\n[2/4] Installing frontend dependencies (if any)..."
cd peeentrest
if [ -f package.json ]; then
    npm install
else
    echo "No package.json found in frontend. Skipping npm install."
fi
cd ..

# Backend run
echo "\n[3/4] Starting backend server..."
cd peeentrest-backend
if [ -f package.json ]; then
    npm run dev &
    BACKEND_PID=$!
    echo "Backend running with PID $BACKEND_PID"
else
    echo "No backend server to run (missing package.json)."
fi
cd ..

# Frontend run
echo "\n[4/4] Starting frontend (static preview)..."
cd peeentrest
if [ -f package.json ]; then
    npm start &
    FRONTEND_PID=$!
    echo "Frontend running with PID $FRONTEND_PID"
else
    # If no package.json, try to serve index.html with npx serve
    if [ -f index.html ]; then
        npx serve . -l 1958 &
        FRONTEND_PID=$!
        echo "Frontend (static) running with PID $FRONTEND_PID on http://localhost:1958"
    else
        echo "No frontend server found."
    fi
fi
cd ..

echo "\nBoth backend and frontend should now be running (in background)."
echo "To stop them, use 'kill $BACKEND_PID $FRONTEND_PID' or close the terminal."
