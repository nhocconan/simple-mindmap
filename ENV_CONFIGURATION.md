# ✅ ENVIRONMENT CONFIGURATION - CENTRALIZED

## 🎉 Problem Solved!

All environment configuration now uses a **single `.env` file in the root directory**.

## 📁 File Structure

```
mindmap-copilot/
├── .env                    ✅ SINGLE SOURCE OF TRUTH
├── .env.example            📝 Template
├── backend/
│   └── .env               🤖 Auto-generated (DO NOT EDIT)
├── frontend/
├── ios/
└── scripts/
    └── start-dev.sh       🚀 Main startup script
```

## 🔑 Root `.env` Configuration

```env
# Database
POSTGRES_USER=mindmap
POSTGRES_PASSWORD=PostgreSQL
POSTGRES_DB=mindmap

# Redis
REDIS_PASSWORD=ARedis123456

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# reCAPTCHA (optional)
RECAPTCHA_SECRET_KEY=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@mindmap.app

# URLs
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 🚀 Quick Start

### 1. Start Everything
```bash
./scripts/start-dev.sh
```

This script will:
- ✅ Load root `.env`
- ✅ Start Docker (Redis & PostgreSQL)
- ✅ Auto-generate `backend/.env` from root `.env`
- ✅ Run database migrations
- ✅ Seed database with admin user
- ✅ Verify all services are healthy

### 2. Start Backend
```bash
cd backend
npm run start:dev
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Start iOS App
```bash
./scripts/ios-dev-run.sh
```

## 🔧 How It Works

### Auto-Generated `backend/.env`

The `start-dev.sh` script automatically creates `backend/.env` from root `.env`:

```bash
# Auto-generated from root .env
# DO NOT EDIT - Edit root .env instead

DATABASE_URL="postgresql://mindmap:PostgreSQL@localhost:5432/mindmap?schema=public"
REDIS_URL="redis://:ARedis123456@localhost:6379"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
...
```

**Important:** Never edit `backend/.env` directly! Always edit root `.env` and run `./scripts/start-dev.sh`.

## ✅ What Was Fixed

### Before (❌ Multiple .env files)
- `backend/.env` - Different passwords
- Root `.env` - Different passwords
- **Result:** Redis auth errors, database connection failures

### After (✅ Single .env)
- Root `.env` - Single source of truth
- `backend/.env` - Auto-generated from root
- **Result:** Everything works!

## 🧪 Testing

### Verify Services
```bash
# Backend
curl http://localhost:4000/api/auth/me
# Should return: {"message":"Unauthorized","statusCode":401}

# Redis
docker exec mindmap-redis redis-cli -a ARedis123456 ping
# Should return: PONG

# PostgreSQL
docker exec mindmap-postgres psql -U mindmap -c "SELECT 1"
# Should return: 1
```

### Test Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mindmap.app","password":"Admin@123!"}'
```

Should return tokens:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "expiresIn": 900
}
```

## 📊 Service Status

```bash
docker ps
```

You should see:
- `mindmap-redis` - Port 6379
- `mindmap-postgres` - Port 5432

## 🔄 Reset Everything

If you need to start completely fresh:

```bash
# Stop all services
docker-compose down -v

# Remove generated backend/.env
rm backend/.env

# Start fresh
./scripts/start-dev.sh
```

## 🔐 Credentials

### Admin User
- **Email:** admin@mindmap.app
- **Password:** Admin@123!

### Database
- **User:** mindmap
- **Password:** PostgreSQL
- **Database:** mindmap
- **Port:** 5432

### Redis
- **Password:** ARedis123456
- **Port:** 6379

## 📖 Related Scripts

- `scripts/start-dev.sh` - Main startup (uses root .env)
- `scripts/ios-dev-run.sh` - iOS build (reads root .env)
- `scripts/ios-prod-build.sh` - iOS production build

## ⚠️ Important Notes

1. **Always edit root `.env`** - Never edit `backend/.env`
2. **Run `start-dev.sh` after changing .env** - To regenerate backend/.env
3. **Don't commit `.env`** - It's in .gitignore
4. **Use `.env.example`** - For sharing configuration template

## 🎯 For Production

Update root `.env` with production values:
- Strong JWT secrets (use `openssl rand -base64 64`)
- Production database credentials
- Production Redis password
- SMTP credentials for emails
- reCAPTCHA keys
- Production URLs

Then run:
```bash
./scripts/start-dev.sh  # Even for production setup
```

## ✅ Success Checklist

- [x] Single `.env` in root directory
- [x] No Redis authentication errors
- [x] Database connections work
- [x] Backend starts cleanly
- [x] iOS app can connect
- [x] All passwords match
- [x] Auto-generation working

---

**Last Updated:** 2025-12-26  
**Status:** ✅ Working Perfectly
**All services:** Using centralized root `.env`
