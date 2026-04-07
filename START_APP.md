# 🚀 Starting Bob Catalog Application

## Current Status
- ✅ Application code is ready
- ✅ Dependencies installed
- ✅ Configuration files created
- ⚠️ Database needs to be set up

## Option 1: Install PostgreSQL (Recommended for Development)

### Using Homebrew (Easiest):
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL
brew services start postgresql@14

# Verify it's running
brew services list | grep postgresql

# Then run the database setup
cd backend && ./setup-db.sh && cd ..

# Start the application
./run-dev.sh
```

### Using Postgres.app (GUI Option):
1. Download from https://postgresapp.com/
2. Install and start Postgres.app
3. Click "Initialize" to create a new server
4. Then run:
```bash
cd backend && ./setup-db.sh && cd ..
./run-dev.sh
```

## Option 2: Use Docker for PostgreSQL

### Start Docker Desktop first, then:
```bash
# Start PostgreSQL in Docker
docker-compose -f docker-compose.dev.yml up -d

# Wait for database to be ready (about 10 seconds)
sleep 10

# Create default admin user
cd backend && node -e "
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bob_catalog' });
(async () => {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  await pool.query(\`
    INSERT INTO users (email, password, full_name, role)
    VALUES ('admin@example.com', \$1, 'Admin User', 'admin')
    ON CONFLICT (email) DO NOTHING
  \`, [hashedPassword]);
  console.log('✓ Admin user created');
  await pool.end();
})();
" && cd ..

# Start the application
./run-dev.sh
```

## Option 3: Quick Demo Without Database Setup

If you just want to see the frontend UI without backend functionality:

```bash
# Start only the frontend
npm run dev
```

Then open http://localhost:5173 to see the UI (backend features won't work)

## After Database is Running

Once you have PostgreSQL running (via any option above), start the app:

```bash
./run-dev.sh
```

This will start:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173

## Default Login Credentials

```
Email:    admin@example.com
Password: Admin123!
```

## Troubleshooting

### Check if PostgreSQL is running:
```bash
# For Homebrew installation
brew services list | grep postgresql

# For Postgres.app
ps aux | grep postgres

# For Docker
docker ps | grep bob-catalog-db
```

### Check if ports are available:
```bash
# Check port 5432 (PostgreSQL)
lsof -i :5432

# Check port 3000 (Backend)
lsof -i :3000

# Check port 5173 (Frontend)
lsof -i :5173
```

### Kill processes on ports if needed:
```bash
kill -9 $(lsof -ti:5432)  # PostgreSQL
kill -9 $(lsof -ti:3000)  # Backend
kill -9 $(lsof -ti:5173)  # Frontend
```

## Next Steps

1. Choose one of the database options above
2. Run `./run-dev.sh`
3. Open http://localhost:5173
4. Login with admin credentials
5. Start managing publications!

## Need Help?

- See QUICKSTART.md for detailed setup instructions
- See DEPLOYMENT_GUIDE.md for production deployment
- See API_DOCUMENTATION.md for API details
