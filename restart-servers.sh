#!/bin/bash

echo "Restarting servers..."

# Kill existing processes
pkill -f "node src/server.js"
pkill -f "vite"

sleep 2

# Get the current directory
CURRENT_DIR=$(pwd)

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server on http://localhost:3000..."
cd "${CURRENT_DIR}/backend" && npm start &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on http://localhost:5173..."
cd "${CURRENT_DIR}" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Servers are running!"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Admin Login:"
echo "  Email:    admin@example.com"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

# Made with Bob
