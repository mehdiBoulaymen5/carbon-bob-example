# Bob Catalog - Quick Start Guide

Get the Bob Catalog application running locally in minutes!

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **PostgreSQL** (v14 or higher) - [Installation Guide](#postgresql-installation)

### Verify Installation
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
psql --version  # Should be 14.0 or higher
```

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Setup Script
This will install all dependencies and create configuration files:

```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check system requirements
- ✅ Install frontend dependencies
- ✅ Install backend dependencies
- ✅ Generate secure random secrets
- ✅ Create `backend/.env` file

### Step 2: Set Up Database
Create and initialize the PostgreSQL database:

```bash
cd backend
chmod +x setup-db.sh
./setup-db.sh
cd ..
```

This will:
- ✅ Create the `bob_catalog` database
- ✅ Run database schema
- ✅ Create default admin user

### Step 3: Start Development Servers
Start both backend and frontend servers:

```bash
chmod +x run-dev.sh
./run-dev.sh
```

## 🎉 Access the Application

Once the servers are running:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Default Admin Credentials
```
Email:    admin@example.com
Password: Admin123!
```

⚠️ **IMPORTANT**: Change the admin password immediately after first login!

## 📦 PostgreSQL Installation

### macOS

#### Option 1: Homebrew (Recommended)
```bash
# Install PostgreSQL
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Add to PATH (add to ~/.zshrc or ~/.bash_profile)
export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
```

#### Option 2: Postgres.app
1. Download from [postgresapp.com](https://postgresapp.com/)
2. Move to Applications folder
3. Open and click "Initialize"
4. Add to PATH: `sudo mkdir -p /etc/paths.d && echo /Applications/Postgres.app/Contents/Versions/latest/bin | sudo tee /etc/paths.d/postgresapp`

#### Option 3: Official Installer
Download from [postgresql.org/download/macosx](https://www.postgresql.org/download/macosx/)

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Windows
1. Download installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
2. Run installer and follow the wizard
3. Remember the password you set for the `postgres` user

## 🔧 Configuration

### Backend Environment Variables

The `backend/.env` file is automatically created by `setup.sh`. Key settings:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bob_catalog
PORT=3000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Database Connection

If you need to modify the database connection:

1. Edit `backend/.env`
2. Update the `DATABASE_URL` with your credentials:
   ```
   postgresql://username:password@host:port/database
   ```

Common configurations:
- **Default PostgreSQL**: `postgresql://postgres:postgres@localhost:5432/bob_catalog`
- **Postgres.app**: `postgresql://postgres@localhost:5432/bob_catalog`
- **Custom user**: `postgresql://myuser:mypass@localhost:5432/bob_catalog`

## 🛠️ Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 2. Create Backend .env
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### 3. Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bob_catalog;
\q

# Run schema
psql -U postgres -d bob_catalog -f backend/src/config/database.sql
```

### 4. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## 🐛 Troubleshooting

### Port Already in Use

**Backend (Port 3000):**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

**Frontend (Port 5173):**
```bash
# Find and kill process
kill -9 $(lsof -ti:5173)
```

### PostgreSQL Connection Issues

**Check if PostgreSQL is running:**
```bash
# macOS (Homebrew)
brew services list

# Linux
sudo systemctl status postgresql

# Test connection
psql -U postgres -c "SELECT version();"
```

**Start PostgreSQL:**
```bash
# macOS (Homebrew)
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Manual start
pg_ctl -D /usr/local/var/postgres start
```

**Reset PostgreSQL password:**
```bash
# macOS/Linux
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
\q
```

### Database Schema Errors

If the schema fails to apply:

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE IF EXISTS bob_catalog;"
psql -U postgres -c "CREATE DATABASE bob_catalog;"
psql -U postgres -d bob_catalog -f backend/src/config/database.sql
```

### Admin Login Not Working

The default password hash in the schema might not work. Create a new admin user:

```bash
# Connect to database
psql -U postgres -d bob_catalog

# Check if admin exists
SELECT email FROM users WHERE email = 'admin@example.com';

# If needed, you can update the password through the application
# or create a new admin user after fixing the hash
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules
rm package-lock.json backend/package-lock.json
npm install
cd backend && npm install && cd ..
```

### CORS Errors

Ensure `CORS_ORIGIN` in `backend/.env` matches your frontend URL:
```env
CORS_ORIGIN=http://localhost:5173
```

## 🔄 Stopping the Servers

If you used `run-dev.sh`:
- Press `Ctrl+C` in the terminal

If you started servers manually:
- Press `Ctrl+C` in each terminal window

To ensure all processes are stopped:
```bash
# Kill backend
kill -9 $(lsof -ti:3000)

# Kill frontend
kill -9 $(lsof -ti:5173)
```

## 📁 Project Structure

```
bob-catalog/
├── backend/              # Backend API (Express.js)
│   ├── src/
│   │   ├── server.js    # Entry point
│   │   ├── config/      # Database config & schema
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, validation, security
│   │   ├── routes/      # API routes
│   │   └── utils/       # Helper functions
│   ├── .env             # Environment variables (created by setup)
│   └── package.json
├── src/                 # Frontend (React + Vite)
│   ├── components/      # React components
│   ├── services/        # API services
│   ├── contexts/        # React contexts
│   └── main.jsx         # Entry point
├── setup.sh             # Initial setup script
├── run-dev.sh           # Start development servers
└── QUICKSTART.md        # This file
```

## 🔐 Security Notes

- Default admin credentials are for development only
- Change the admin password immediately after first login
- Never commit `.env` files to version control
- The setup script generates secure random secrets
- In production, use strong passwords and HTTPS

## 📚 Additional Resources

- [API Documentation](API_DOCUMENTATION.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Testing Guide](TESTING_GUIDE.md)

## 💡 Tips

- Use `npm run dev` in backend for auto-reload on changes
- Frontend uses Vite for fast hot module replacement
- Check `backend.log` and `frontend.log` for server output
- Use browser DevTools to inspect API calls
- PostgreSQL data is persisted between restarts

## 🆘 Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review log files: `backend.log` and `frontend.log`
3. Verify all prerequisites are installed correctly
4. Ensure PostgreSQL is running
5. Check that ports 3000 and 5173 are available

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] Node.js v18+ is installed
- [ ] PostgreSQL is installed and running
- [ ] Database `bob_catalog` exists
- [ ] `backend/.env` file exists
- [ ] Dependencies are installed (node_modules folders exist)
- [ ] Ports 3000 and 5173 are available
- [ ] No errors in `backend.log` or `frontend.log`

---

**Happy coding! 🚀**