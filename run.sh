#!/bin/bash

# Start the server
echo "Starting backend..."
nohup uv run backend/backend.py > backend.log 2>&1 &
echo $! > backend.pid  # Store backend PID

# Navigate to the frontend directory and start the frontend
cd frontend || exit
echo "Starting frontend..."
nohup npm run dev > frontend.log 2>&1 &
echo $! > ../frontend.pid  # Store frontend PID

echo "Backend and frontend started!"