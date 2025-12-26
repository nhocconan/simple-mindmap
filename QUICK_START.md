# 🚀 QUICK START GUIDE

## ✅ Everything is Ready!

Your development environment is now configured with a **single `.env` file**.

## 📋 Current Status

✅ Docker services running (Redis & PostgreSQL)  
✅ Database migrated and seeded  
✅ Backend running on port 4000  
✅ No Redis authentication errors  
✅ All passwords synchronized  

## 🎯 What You Can Do Now

### 1. Test Backend API

```bash
# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mindmap.app","password":"Admin@123!"}'

# Should return access token and refresh token
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

Then open: http://localhost:3000

### 3. Start iOS App

```bash
./scripts/ios-dev-run.sh
```

The app will:
- Configure API URL automatically
- Build the project
- Launch in iOS Simulator
- Connect to your local backend

### 4. Test iOS App

1. Simulator should open with the app
2. Login with: `admin@mindmap.app` / `Admin@123!`
3. Create a mindmap
4. Add nodes and test functionality

## 🔑 Credentials

**Admin User:**
- Email: `admin@mindmap.app`
- Password: `Admin@123!`

**Database:**
- User: `mindmap`
- Password: `PostgreSQL`
- Database: `mindmap`
- Port: `5432`

**Redis:**
- Password: `ARedis123456`
- Port: `6379`

## 📊 Services

| Service | URL | Status |
|---------|-----|--------|
| Backend | http://localhost:4000 | ✅ Running |
| Frontend | http://localhost:3000 | Ready to start |
| PostgreSQL | localhost:5432 | ✅ Running |
| Redis | localhost:6379 | ✅ Running |

## 🔄 Common Commands

### Start Development Environment
```bash
./scripts/start-dev.sh
```

### Start Backend
```bash
cd backend && npm run start:dev
```

### Start Frontend
```bash
cd frontend && npm run dev
```

### Start iOS App
```bash
./scripts/ios-dev-run.sh
```

### View Docker Logs
```bash
docker-compose logs -f
```

### Reset Everything
```bash
docker-compose down -v
./scripts/start-dev.sh
```

## 🐛 Troubleshooting

### Backend Says "EADDRINUSE"
```bash
lsof -ti:4000 | xargs kill -9
cd backend && npm run start:dev
```

### Redis Auth Error
```bash
# Check root .env has: REDIS_PASSWORD=ARedis123456
./scripts/start-dev.sh  # This will regenerate backend/.env
```

### Database Connection Failed
```bash
docker ps  # Check if postgres is running
docker exec mindmap-postgres psql -U mindmap -c "SELECT 1"
```

### iOS App Can't Connect
- Change `localhost` to `127.0.0.1` in app
- Ensure backend is running: `curl http://127.0.0.1:4000/api/auth/me`

## 📖 Full Documentation

- [ENV_CONFIGURATION.md](./ENV_CONFIGURATION.md) - Environment setup details
- [README.md](./README.md) - Complete project documentation
- [BACKEND_RUNNING.md](./BACKEND_RUNNING.md) - Backend specifics
- [IOS_APP_RUNNING.md](./IOS_APP_RUNNING.md) - iOS development guide
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What's built

## ✨ Next Steps

1. **Test the web app** - Start frontend and create mindmaps
2. **Test the iOS app** - Run on simulator and verify sync
3. **Develop features** - Add your own functionality
4. **Deploy to production** - Follow deployment guide in README.md

## 🎉 Success!

Your mindmap application is now running with:
- ✅ Unified configuration (single .env)
- ✅ Backend API (NestJS)
- ✅ Frontend web app (Next.js)
- ✅ iOS native app (SwiftUI)
- ✅ Database and caching (PostgreSQL + Redis)
- ✅ Cross-platform data sync

**Happy coding! 🚀**

---

**Issues?** Check documentation or reset with `./scripts/start-dev.sh`
