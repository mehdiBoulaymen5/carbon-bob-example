#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Starting Local Development Environment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running. Please start Docker Desktop and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Use port 5433 instead of 5432 (which is in use)
DB_PORT=5433

# Step 1: Start PostgreSQL with Docker
echo ""
echo -e "${BLUE}Step 1: Starting PostgreSQL database on port ${DB_PORT}...${NC}"

# Stop and remove existing container if it exists
docker stop admin-postgres 2>/dev/null || true
docker rm admin-postgres 2>/dev/null || true

# Start PostgreSQL container
docker run -d \
  --name admin-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_DB=admin_system \
  -p ${DB_PORT}:5432 \
  postgres:15-alpine

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Check if PostgreSQL is ready
for i in {1..30}; do
    if docker exec admin-postgres pg_isready -U admin > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready on port ${DB_PORT}${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Step 2: Initialize database schema
echo ""
echo -e "${BLUE}Step 2: Initializing database schema...${NC}"

# Copy SQL file to container and execute it
docker cp backend/src/config/database.sql admin-postgres:/tmp/database.sql
docker exec admin-postgres psql -U admin -d admin_system -f /tmp/database.sql > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database schema initialized${NC}"
else
    echo -e "${RED}✗ Failed to initialize database schema${NC}"
    exit 1
fi

# Step 3: Create backend .env file
echo ""
echo -e "${BLUE}Step 3: Setting up backend environment...${NC}"

cat > backend/.env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=${DB_PORT}
DB_NAME=admin_system
DB_USER=admin
DB_PASSWORD=admin123

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(openssl rand -hex 32)
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-$(openssl rand -hex 32)

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo -e "${GREEN}✓ Backend .env file created${NC}"

# Step 4: Install backend dependencies
echo ""
echo -e "${BLUE}Step 4: Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backend dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi
cd ..

# Step 5: Install frontend dependencies
echo ""
echo -e "${BLUE}Step 5: Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    else
        echo -e "${RED}✗ Failed to install frontend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Step 6: Create default admin user
echo ""
echo -e "${BLUE}Step 6: Creating default admin user...${NC}"

# Use Node.js to generate a proper bcrypt hash
cd backend
HASHED_PASSWORD=$(node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  console.log(hash);
});
" 2>/dev/null)
cd ..

if [ ! -z "$HASHED_PASSWORD" ]; then
    docker exec admin-postgres psql -U admin -d admin_system -c "
    INSERT INTO users (email, password_hash, name, role, is_active)
    VALUES ('admin@example.com', '${HASHED_PASSWORD}', 'Admin User', 'admin', true)
    ON CONFLICT (email) DO NOTHING;
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✓ Default admin user created${NC}"
else
    echo -e "${YELLOW}⚠ Could not create admin user automatically${NC}"
    echo -e "${YELLOW}  You can create it manually after starting the server${NC}"
fi

# Step 7: Start the applications
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Starting Applications${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get the current directory
CURRENT_DIR=$(pwd)

# Create a script to run both servers
cat > run-servers.sh << EOFSCRIPT
#!/bin/bash

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill \$BACKEND_PID \$FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server on http://localhost:3000..."
cd "${CURRENT_DIR}/backend" && npm start &
BACKEND_PID=\$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on http://localhost:5173..."
cd "${CURRENT_DIR}" && npm run dev &
FRONTEND_PID=\$!

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
echo "  Port:     ${DB_PORT}"
echo "  Database: admin_system"
echo "  User:     admin"
echo "  Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait \$BACKEND_PID \$FRONTEND_PID
EOFSCRIPT

chmod +x run-servers.sh

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Database:${NC}"
echo -e "  Host:     localhost"
echo -e "  Port:     ${DB_PORT}"
echo -e "  Database: admin_system"
echo -e "  User:     admin"
echo -e "  Password: admin123"
echo ""
echo -e "${BLUE}Admin Credentials:${NC}"
echo -e "  Email:    admin@example.com"
echo -e "  Password: admin123"
echo ""
echo -e "${YELLOW}Starting servers...${NC}"
echo ""

# Run the servers
./run-servers.sh

# Made with Bob
