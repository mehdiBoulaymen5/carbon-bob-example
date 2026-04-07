#!/bin/bash

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
cd "/Users/mehdiboulaymen/Documents/Data/bob demos /carbon example/backend" && npm start &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on http://localhost:5173..."
cd "/Users/mehdiboulaymen/Documents/Data/bob demos /carbon example" && npm run dev &
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
echo "Database:"
echo "  Host:     localhost"
echo "  Port:     5433"
echo "  Database: admin_system"
echo "  User:     admin"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
