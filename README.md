# Mindmap Application - Full Stack

A collaborative mindmapping application with web and iOS clients.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Xcode (for iOS development)

### Start Development Environment

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your settings

# 2. Start all services
./scripts/start-dev.sh

# 3. Start backend (in new terminal)
cd backend && npm run start:dev

# 4. Start frontend (in new terminal)
cd frontend && npm run dev

# 5. Start iOS app (optional)
./scripts/ios-dev-run.sh
```

### Access Applications

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **API Docs:** http://localhost:4000/api

### Default Credentials

- **Email:** admin@mindmap.app
- **Password:** Admin@123!

## 📁 Project Structure

```
mindmap-copilot/
├── .env                   # Single source of truth for config
├── backend/              # NestJS REST API
├── frontend/             # Next.js web app
├── ios/                  # SwiftUI iOS app
├── nginx/                # Reverse proxy config
└── scripts/              # Development scripts
```

## 🔧 Configuration

**All configuration uses the root `.env` file.**

Key environment variables:
- `POSTGRES_PASSWORD` - Database password
- `REDIS_PASSWORD` - Redis password
- `JWT_SECRET` - JWT signing secret
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:4000)

## 📱 Platforms

### Web Application
- Next.js 14 with TypeScript
- React Flow for mindmap visualization
- TailwindCSS for styling
- Real-time collaboration ready

### iOS Application
- SwiftUI native app
- Touch-optimized mindmap editor
- Cross-platform data sync
- Offline mode (coming soon)

## 🏗️ Architecture

### Backend (NestJS)
- REST API with JWT authentication
- PostgreSQL database with Prisma ORM
- Redis for caching and sessions
- Rate limiting and security headers

### Frontend (Next.js)
- Server-side rendering
- React Flow for mindmaps
- State management with Context API
- Responsive design

### iOS (SwiftUI)
- MVVM architecture
- URLSession for networking
- UserDefaults for token storage
- Native gestures (pinch, pan, tap)

## 📖 Documentation

- [iOS Development](./IOS_APP_RUNNING.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./TESTING_GUIDE.md)

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test

# Frontend tests
cd frontend
npm run test

# E2E tests
npm run test:e2e
```

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Reset all data
docker-compose down -v

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

## 🛠️ Development Scripts

```bash
# Start development environment
./scripts/start-dev.sh

# Build and run iOS app
./scripts/ios-dev-run.sh

# Build iOS for production
./scripts/ios-prod-build.sh
```

## 🚢 Deployment

### Docker Compose (Production)
```bash
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment
1. Build backend: `cd backend && npm run build`
2. Build frontend: `cd frontend && npm run build`
3. Configure nginx
4. Start services

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configured
- Helmet.js for security headers
- Rate limiting
- Input validation
- SQL injection protection (Prisma)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Troubleshooting

### Backend won't start
- Check `.env` configuration
- Ensure Docker services are running
- Run `./scripts/start-dev.sh`

### Database connection error
- Verify PostgreSQL is running: `docker ps`
- Check credentials in root `.env`

### Redis authentication error
- Verify Redis password in root `.env`
- Restart: `./scripts/start-dev.sh`

### iOS app can't connect
- Use `127.0.0.1` instead of `localhost`
- Ensure backend is running
- Check iOS app logs

## 📧 Contact

[Your Contact Information]

---

**Built with ❤️ using NestJS, Next.js, and SwiftUI**
