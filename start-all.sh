#!/bin/bash

# Start all three services concurrently
echo "Starting Time Tracker services..."

# Backend
echo "Starting backend..."
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!

# Frontend
echo "Starting frontend..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

# Tracker
echo "Starting tracker..."
cd "$(dirname "$0")/tracker"
python main.py &
TRACKER_PID=$!

echo "All services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Tracker PID: $TRACKER_PID"
echo ""
echo "To stop all services, run: kill $BACKEND_PID $FRONTEND_PID $TRACKER_PID"

# Wait for all processes
wait
