#!/bin/bash

# Bob Catalog - Setup Script
# This script sets up the local development environment

set -e  # Exit on error

echo "=========================================="
echo "Bob Catalog - Local Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
    echo -e "ℹ $1"
}

# Check Node.js
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm -v) detected"

# Check PostgreSQL
echo ""
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    print_warning "PostgreSQL command-line tools not found in PATH"
    print_info "PostgreSQL is required for this application."
    print_info ""
    print_info "Installation options:"
    print_info "  1. Homebrew (recommended): brew install postgresql@14"
    print_info "  2. Postgres.app: https://postgresapp.com/"
    print_info "  3. Official installer: https://www.postgresql.org/download/macosx/"
    print_info ""
    read -p "Do you have PostgreSQL installed? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Please install PostgreSQL and run this script again"
        exit 1
    fi
else
    print_success "PostgreSQL detected: $(psql --version)"
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
if npm install; then
    print_success "Backend dependencies installed"
else
    print_error "Failed to install backend dependencies"
    exit 1
fi
cd ..

# Generate random secrets
echo ""
echo "Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
CSRF_SECRET=$(openssl rand -base64 32)
COOKIE_SECRET=$(openssl rand -base64 32)

# Create backend .env file
echo ""
echo "Creating backend .env file..."
cat > backend/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bob_catalog
DB_SSL=false

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
NODE_ENV=development
PORT=3000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# CSRF Configuration
CSRF_SECRET=${CSRF_SECRET}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Cookie Configuration
COOKIE_SECRET=${COOKIE_SECRET}
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax

# Logging
LOG_LEVEL=info
EOF

print_success "Backend .env file created with secure random secrets"

# Make database setup script executable
chmod +x backend/setup-db.sh

echo ""
echo "=========================================="
print_success "Setup completed successfully!"
echo "=========================================="
echo ""
print_info "Next steps:"
echo "  1. Set up the database:"
echo "     cd backend && ./setup-db.sh"
echo ""
echo "  2. Start the application:"
echo "     ./run-dev.sh"
echo ""
print_warning "Default admin credentials:"
echo "     Email: admin@example.com"
echo "     Password: Admin123!"
echo ""
print_warning "IMPORTANT: Change the admin password after first login!"
echo ""

# Made with Bob
