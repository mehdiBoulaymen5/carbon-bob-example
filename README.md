# Bob Demo Catalog

A modern, full-stack demo catalog application for showcasing IBM Bob demonstrations and capabilities. Built with React, Node.js, PostgreSQL, and IBM Carbon Design System, featuring real-time updates via Server-Sent Events (SSE).

![Bob Demo Catalog](./media/image.png)

## 📦 Repository

- **GitHub**: [https://github.com/mehdiBoulaymen5/bob-demo-catalog](https://github.com/mehdiBoulaymen5/bob-demo-catalog)
- **Clone**: `git clone https://github.com/mehdiBoulaymen5/bob-demo-catalog.git`

## ✨ Features

### Public Features
- **Publication Catalog**: Browse and search published demonstrations
- **Advanced Filtering**: Filter by topics, industries, and audience
- **Real-time Updates**: Automatic updates when publications are added/modified
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **SEO Optimized**: Meta tags and structured data for better discoverability
- **Publication Details**: Detailed view with related publications

### Admin Features
- **Secure Authentication**: JWT-based admin authentication
- **Publication Management**: Full CRUD operations for publications
- **Dashboard Analytics**: Real-time statistics and insights
- **Audit Logging**: Complete activity tracking
- **Bulk Operations**: Batch delete and manage publications
- **Real-time Notifications**: SSE-powered live updates across admin sessions

### Technical Features
- **Server-Sent Events (SSE)**: Real-time bidirectional updates
- **RESTful API**: Well-structured backend API
- **Security**: CSRF protection, rate limiting, input sanitization
- **Database**: PostgreSQL with optimized queries
- **Docker Support**: Full containerization with Docker Compose
- **Production Ready**: Comprehensive deployment documentation

## 🛠️ Tech Stack

### Frontend
- **React** 18.3.1 - UI library
- **Vite** 6.0.3 - Build tool and dev server
- **React Router** 7.1.1 - Client-side routing
- **Carbon Design System** (@carbon/react v1.68.0) - IBM's design system
- **Carbon Icons** (@carbon/icons-react v11.49.0) - Icon library
- **SCSS** - Styling with Carbon tokens

### Backend
- **Node.js** 18+ - Runtime environment
- **Express** 4.21.2 - Web framework
- **PostgreSQL** 14+ - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Server-Sent Events** - Real-time updates

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **nginx** - Web server for frontend
- **IBM Cloud Code Engine** - Cloud deployment platform

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Docker and Docker Compose (optional)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/mehdiBoulaymen5/bob-demo-catalog.git
   cd bob-demo-catalog
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup Database**
   ```bash
   # Create database
   createdb bob_demo_catalog
   
   # Run schema
   psql -d bob_demo_catalog -f src/config/database.sql
   ```

4. **Setup Frontend**
   ```bash
   cd ..
   npm install
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Admin Login: http://localhost:5173/admin/login

### Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API endpoints and usage
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - IBM Cloud Code Engine deployment

## 📁 Project Structure

```
bob-demo-catalog/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Database and configuration
│   │   ├── controllers/       # Request handlers (including SSE)
│   │   ├── middleware/        # Auth, security, validation
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── server.js          # Express server
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── src/                       # Frontend application
│   ├── components/
│   │   ├── admin/            # Admin components
│   │   ├── public/           # Public components
│   │   └── shared/           # Shared components
│   ├── contexts/             # React contexts (Auth, SSE)
│   ├── services/             # API services (including SSE)
│   ├── utils/                # Utility functions
│   ├── config/               # Configuration
│   ├── App.jsx               # Root component
│   └── main.jsx              # Entry point
├── docker-compose.yml         # Docker orchestration
├── Dockerfile                 # Frontend Docker image
├── nginx.conf                 # nginx configuration
└── README.md                  # This file
```

## 🔑 Key Features Explained

### Real-time Updates (SSE)

The application uses Server-Sent Events for real-time updates:

- **Public clients** receive notifications when publications are published
- **Admin clients** receive notifications for all publication changes
- **Automatic reconnection** with exponential backoff
- **Heartbeat mechanism** to keep connections alive

### Security

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable rounds
- **CSRF Protection**: Token-based CSRF prevention
- **Rate Limiting**: Configurable request rate limits
- **Input Sanitization**: XSS and injection prevention
- **Audit Logging**: Complete activity tracking

### Admin Dashboard

- **Real-time Statistics**: Live publication counts and views
- **Recent Activity**: Audit log of recent actions
- **Top Publications**: Most viewed publications
- **Quick Actions**: Fast access to common tasks

## 🌐 API Endpoints

### Public Endpoints
- `GET /api/publications` - List published publications
- `GET /api/publications/:id` - Get publication details
- `GET /api/events` - SSE endpoint for real-time updates

### Admin Endpoints (Authenticated)
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/admin/publications` - List all publications
- `POST /api/admin/publications` - Create publication
- `PUT /api/admin/publications/:id` - Update publication
- `DELETE /api/admin/publications/:id` - Delete publication
- `GET /api/admin/events` - SSE endpoint for admin updates
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/audit-logs` - Audit logs

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

## 🚢 Deployment

### Production Build

```bash
# Build frontend
npm run build

# Backend is production-ready as-is
cd backend
npm install --production
```

### Docker Deployment

```bash
# Build and start
docker-compose up -d

# Scale services
docker-compose up -d --scale backend=3
```

### IBM Cloud Code Engine

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_NAME=bob_demo_catalog
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://your-domain.com
```

#### Frontend (.env.production)
```env
VITE_API_URL=https://api.your-domain.com/api
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete configuration options.

## 🧪 Testing

```bash
# Run backend tests (when available)
cd backend
npm test

# Run frontend tests (when available)
npm test
```

## 📊 Monitoring

- **Health Check**: `GET /health`
- **SSE Stats**: `GET /api/events/stats` (admin only)
- **Application Logs**: stdout/stderr
- **Audit Logs**: Database table

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- **IBM Carbon Design System** - UI components and design guidelines
- **React Community** - Excellent ecosystem and tools
- **Node.js Community** - Robust backend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/mehdiBoulaymen5/bob-demo-catalog/issues)
- **Documentation**: See docs in this repository
- **Email**: Contact repository owner

## 🗺️ Roadmap

- [ ] User registration and profiles
- [ ] Publication comments and ratings
- [ ] Advanced search with Elasticsearch
- [ ] Multi-language support
- [ ] Export functionality
- [ ] API rate limiting per user
- [ ] WebSocket support for chat
- [ ] Mobile app

---

**Made with ❤️ using IBM Carbon Design System and modern web technologies**

**Version**: 1.0.0  
**Last Updated**: April 2024