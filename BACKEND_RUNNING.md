# Backend Development Server - Quick Start Guide

## ✅ Issue Fixed: Redis Authentication

### Problem
```
[ioredis] Unhandled error event: ReplyError: NOAUTH Authentication required.
```

### Root Cause
The backend `.env` had `REDIS_URL="redis://localhost:6379"` (no password), but Docker Redis is configured with password `redis_secret`.

### Solution Applied
Updated `backend/.env`:
```env
REDIS_URL="redis://:redis_secret@localhost:6379"
```

## 🚀 Starting Development Server

### Prerequisites
Make sure Docker containers are running:
```bash
docker ps | grep mindmap
```

You should see:
- `mindmap-redis` - Redis (port 6379)
- `mindmap-postgres` - PostgreSQL (port 5432)

### Start Backend
```bash
cd backend
npm run start:dev
```

The server should start on port 4000 without Redis errors.

## ✅ Verification

### Test Redis Connection
```bash
docker exec mindmap-redis redis-cli -a redis_secret ping
# Should return: PONG
```

### Test Backend API
```bash
curl http://localhost:4000/api/auth/me
# Should return: {"message":"Unauthorized","statusCode":401}
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mindmap.app","password":"Admin@123!"}'
# Should return: {"accessToken":"...","refreshToken":"...","expiresIn":900}
```

## 🔧 Common Issues

### Issue: Redis container not running
```bash
cd /path/to/mindmap-copilot
docker-compose up -d redis postgres
```

### Issue: Database needs seeding
```bash
cd backend
npx ts-node prisma/seed.ts
```

### Issue: Port 4000 already in use
```bash
lsof -ti:4000 | xargs kill -9
```

## 📝 Environment Variables

The backend `.env` should have:
```env
# Database
DATABASE_URL="postgresql://mindmap:change_this_secure_password@localhost:5432/mindmap?schema=public"

# Redis (with password!)
REDIS_URL="redis://:redis_secret@localhost:6379"

# JWT
JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 🎯 For iOS Development

Once backend is running:
1. Backend: `http://localhost:4000` (or `http://127.0.0.1:4000` for iOS simulator)
2. Login: `admin@mindmap.app` / `Admin@123!`
3. iOS app should connect successfully

## 📊 Service Status

### Check All Services
```bash
# Backend
curl http://localhost:4000/api/auth/me

# Redis
docker exec mindmap-redis redis-cli -a redis_secret ping

# PostgreSQL
docker exec mindmap-postgres pg_isready

# Frontend (if running)
curl http://localhost:3000
```

## ✅ Expected Output

When backend starts successfully, you should see:
```
[Nest] 63328  - 12/26/2025, 10:53:00 AM     LOG [NestApplication] Nest application successfully started
Application running on port 4000
```

**No Redis auth errors!**

---

**Last Updated:** 2025-12-26
**Status:** ✅ Working
