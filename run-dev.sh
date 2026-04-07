#!/bin/bash

# Bob Catalog - Development Server Runner
# This script starts both backend and frontend development servers

set -e  # Exit on error

echo "=========================================="
echo "Bob Catalog - Starting Development Servers"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if .env exists
if [ ! -f backend/.env ]; then
    print_error "Backend .env file not found!"
    print_info "Please run ./setup.sh first"
    exit 1
fi

# Check if node_modules exist
if [ ! -d node_modules ]; then
    print_error "Frontend dependencies not installed!"
    print_info "Please run ./setup.sh first"
    exit 1
fi

if [ ! -d backend/node_modules ]; then
    print_error "Backend dependencies not installed!"
    print_info "Please run ./setup.sh first"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    print_info "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        print_success "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        print_success "Frontend server stopped"
    fi
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

print_info "Checking if ports are available..."
if ! check_port 3000; then
    print_error "Port 3000 is already in use (Backend)"
    print_info "Please stop the process using port 3000 or change the PORT in backend/.env"
    exit 1
fi

if ! check_port 5173; then
    print_error "Port 5173 is already in use (Frontend)"
    print_info "Please stop the process using port 5173"
    exit 1
fi

print_success "Ports 3000 and 5173 are available"

# Start backend server
echo ""
print_info "Starting backend server on port 3000..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend server failed to start"
    print_info "Check backend.log for details"
    cat backend.log
    exit 1
fi

print_success "Backend server started (PID: $BACKEND_PID)"

# Start frontend server
echo ""
print_info "Starting frontend server on port 5173..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 2

# Check if frontend is running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend server failed to start"
    print_info "Check frontend.log for details"
    cat frontend.log
    exit 1
fi

print_success "Frontend server started (PID: $FRONTEND_PID)"

# Display information
echo ""
echo "=========================================="
print_success "Development servers are running!"
echo "=========================================="
echo ""
print_info "Frontend: ${BLUE}http://localhost:5173${NC}"
print_info "Backend:  ${BLUE}http://localhost:3000${NC}"
echo ""
print_warning "Default admin credentials:"
echo "  Email:    admin@example.com"
echo "  Password: Admin123!"
echo ""
print_info "Logs:"
echo "  Backend:  backend.log"
echo "  Frontend: frontend.log"
echo ""
print_info "Press Ctrl+C to stop both servers"
echo ""

# Keep script running and show logs
tail -f backend.log frontend.log 2>/dev/null || wait

# Made with Bob
