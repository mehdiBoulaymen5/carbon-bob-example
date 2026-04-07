#!/bin/bash

# Stop Local Development Environment
# This script stops all running services (frontend, backend, and PostgreSQL)

set -e

echo "🛑 Stopping Local Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Stop frontend (Vite dev server)
echo "Stopping frontend server..."
if pgrep -f "vite" > /dev/null; then
    pkill -f "vite" && print_status "Frontend server stopped" || print_error "Failed to stop frontend"
else
    print_warning "Frontend server not running"
fi

# Stop backend (Node.js server)
echo "Stopping backend server..."
if pgrep -f "node.*backend" > /dev/null; then
    pkill -f "node.*backend" && print_status "Backend server stopped" || print_error "Failed to stop backend"
else
    print_warning "Backend server not running"
fi

# Stop PostgreSQL Docker container
echo "Stopping PostgreSQL container..."
if docker ps | grep -q "admin-postgres"; then
    docker stop admin-postgres && print_status "PostgreSQL container stopped" || print_error "Failed to stop PostgreSQL"
else
    print_warning "PostgreSQL container not running"
fi

echo ""
echo "🎉 All services stopped successfully!"
echo ""
echo "To start services again, run: ./start-local.sh"

# Made with Bob
