#!/bin/bash

set -e

BACKEND_PORT=3000
FRONTEND_PORT=5173

cleanup() {
    echo ""
    echo "Shutting down servers..."
    if [ -n "${BACKEND_PID:-}" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID:-}" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

kill_port_processes() {
    local port="$1"
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo "Stopping existing process(es) on port $port: $pids"
        kill $pids 2>/dev/null || true
        sleep 1
    fi
}

kill_port_processes "$BACKEND_PORT"
kill_port_processes "$FRONTEND_PORT"

echo "Starting backend server on http://localhost:${BACKEND_PORT}..."
cd "/Users/mehdiboulaymen/Documents/Data/bob demos /carbon example/backend" && npm start &
BACKEND_PID=$!

sleep 3

echo "Starting frontend server on http://localhost:${FRONTEND_PORT}..."
cd "/Users/mehdiboulaymen/Documents/Data/bob demos /carbon example" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Servers are running!"
echo "=========================================="
echo ""
echo "Backend:  http://localhost:${BACKEND_PORT}"
echo "Frontend: http://localhost:${FRONTEND_PORT}"
echo ""
echo "Admin Login:"
echo "  Email:    admin@example.com"
echo "  Password: admin123"
echo ""
echo "Storage mode: ${STORAGE_MODE:-database}"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

wait $BACKEND_PID $FRONTEND_PID

# Made with Bob
