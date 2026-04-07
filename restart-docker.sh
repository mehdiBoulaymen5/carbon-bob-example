#!/bin/bash

# Restart Docker PostgreSQL Container
# This script stops and removes the old container, then creates a fresh one

set -e

echo "🔄 Restarting Docker PostgreSQL Container"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop and remove existing container
echo "1. Stopping existing PostgreSQL container..."
if docker ps -a | grep -q "admin-postgres"; then
    docker stop admin-postgres 2>/dev/null || true
    docker rm admin-postgres 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Old container removed"
else
    echo -e "${YELLOW}⚠${NC} No existing container found"
fi

# Remove old volume (optional - uncomment to delete all data)
# echo "2. Removing old volume..."
# docker volume rm admin-postgres-data 2>/dev/null || true

echo ""
echo "2. Creating new PostgreSQL container..."
docker run -d \
  --name admin-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=admin_system \
  -p 5433:5432 \
  -v admin-postgres-data:/var/lib/postgresql/data \
  postgres:15-alpine

echo -e "${GREEN}✓${NC} New container created"

echo ""
echo "3. Waiting for PostgreSQL to be ready..."
sleep 5

# Test connection
if docker exec admin-postgres pg_isready -U admin > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
else
    echo -e "${RED}✗${NC} PostgreSQL not ready yet, waiting..."
    sleep 5
fi

echo ""
echo "4. Running database schema..."
docker exec -i admin-postgres psql -U admin -d admin_system < backend/src/config/database.sql

echo -e "${GREEN}✓${NC} Database schema created"

echo ""
echo "5. Creating admin user with correct password..."
HASH='$2b$10$u9Jes/jgyMGikQJJpzxd3esujnQbnzZLVwFl7E2jJfekgW4qr.QqW'
docker exec admin-postgres psql -U admin -d admin_system -c "
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES ('admin@example.com', '$HASH', 'Admin User', 'admin', true)
ON CONFLICT (email) DO UPDATE SET password_hash = '$HASH';
"

echo -e "${GREEN}✓${NC} Admin user created/updated"

echo ""
echo "6. Verifying setup..."
docker exec admin-postgres psql -U admin -d admin_system -c "SELECT email, role FROM users WHERE email = 'admin@example.com';"

echo ""
echo -e "${GREEN}🎉 Docker PostgreSQL container restarted successfully!${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart your backend server: cd backend && npm start"
echo "  2. Clear browser cookies or use Incognito window"
echo "  3. Login at: http://localhost:5173/admin/login"
echo "  4. Credentials: admin@example.com / admin123"
echo ""

# Made with Bob
