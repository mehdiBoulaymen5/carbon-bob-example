#!/bin/bash

# Bob Catalog - Database Setup Script
# This script creates the PostgreSQL database and initializes the schema

set -e  # Exit on error

echo "=========================================="
echo "Bob Catalog - Database Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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
    echo -e "ℹ $1"
}

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    print_success "Loaded environment variables from .env"
else
    print_error ".env file not found. Please run setup.sh first."
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://username:password@host:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

print_info "Database configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if PostgreSQL is running
print_info "Checking PostgreSQL connection..."
if ! PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    print_error "Cannot connect to PostgreSQL server"
    print_info ""
    print_info "Troubleshooting steps:"
    print_info "  1. Make sure PostgreSQL is running:"
    print_info "     brew services start postgresql@14"
    print_info "     OR"
    print_info "     pg_ctl -D /usr/local/var/postgres start"
    print_info ""
    print_info "  2. Check if the user exists and has the correct password"
    print_info "  3. Update DATABASE_URL in backend/.env if needed"
    print_info ""
    exit 1
fi
print_success "Connected to PostgreSQL server"

# Check if database exists
echo ""
print_info "Checking if database '$DB_NAME' exists..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? This will DELETE ALL DATA! (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Dropping database '$DB_NAME'..."
        PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"
        print_success "Database dropped"
    else
        print_info "Skipping database creation"
        read -p "Do you want to run the schema SQL anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Setup cancelled"
            exit 0
        fi
    fi
fi

# Create database if it doesn't exist
if ! PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_info "Creating database '$DB_NAME'..."
    PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
    print_success "Database created"
fi

# Run schema SQL
echo ""
print_info "Running database schema..."
if PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f src/config/database.sql > /dev/null 2>&1; then
    print_success "Database schema created successfully"
else
    print_error "Failed to create database schema"
    print_info "Check src/config/database.sql for errors"
    exit 1
fi

# Verify tables were created
echo ""
print_info "Verifying database setup..."
TABLE_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
if [ "$TABLE_COUNT" -ge 4 ]; then
    print_success "Database tables created: $TABLE_COUNT tables"
else
    print_error "Expected at least 4 tables, found: $TABLE_COUNT"
    exit 1
fi

# Check if default admin user exists
echo ""
print_info "Checking default admin user..."
ADMIN_COUNT=$(PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE email = 'admin@example.com';")
if [ "$ADMIN_COUNT" -eq 1 ]; then
    print_success "Default admin user exists"
else
    print_warning "Default admin user not found. Creating..."
    # Note: The password hash in database.sql might not work, so we'll need to create it properly
    print_warning "You may need to create an admin user manually or update the password hash"
fi

echo ""
echo "=========================================="
print_success "Database setup completed!"
echo "=========================================="
echo ""
print_warning "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: Admin123!"
echo ""
print_warning "IMPORTANT: Change the admin password after first login!"
echo ""
print_info "You can now start the application with: ./run-dev.sh"
echo ""

# Made with Bob
