#!/bin/bash

# Development Environment Startup Script
# Uses root .env file for all services

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "  Starting Development Environment"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found in root directory"
    echo "   Please copy .env.example to .env and configure it"
    exit 1
fi

echo "✅ Found root .env file"
echo ""

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

echo "📦 Environment Variables:"
echo "   POSTGRES_USER=$POSTGRES_USER"
echo "   POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "   POSTGRES_DB=$POSTGRES_DB"
echo "   REDIS_PASSWORD=$REDIS_PASSWORD"
echo "   JWT_SECRET=${JWT_SECRET:0:20}..."
echo ""

# Stop any running containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true
echo ""

# Start Docker services
echo "🐳 Starting Docker services (Redis & PostgreSQL)..."
docker-compose up -d redis postgres

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check Redis
echo -n "   Redis: "
if docker exec mindmap-redis redis-cli -a "$REDIS_PASSWORD" ping >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Failed"
    exit 1
fi

# Check PostgreSQL
echo -n "   PostgreSQL: "
if docker exec mindmap-postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
    echo "✅ Healthy"
else
    echo "❌ Failed"
    exit 1
fi

echo ""
echo "🔧 Setting up backend environment..."

# Create backend .env from root .env
cat > backend/.env << EOF
# Auto-generated from root .env
# DO NOT EDIT - Edit root .env instead

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}?schema=public"
REDIS_URL="redis://:${REDIS_PASSWORD}@localhost:6379"
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
RECAPTCHA_SECRET_KEY=${RECAPTCHA_SECRET_KEY}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASSWORD=${SMTP_PASSWORD}
SMTP_FROM=${SMTP_FROM}
FRONTEND_URL=${FRONTEND_URL}
EOF

echo "✅ Created backend/.env from root .env"
echo ""

# Run Prisma migrations
echo "🔄 Running database migrations..."
cd backend
npx prisma migrate deploy || true
echo ""

# Seed database
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts || echo "⚠️  Seed skipped (may already exist)"
echo ""

cd "$PROJECT_ROOT"

echo "=========================================="
echo "  ✅ Development Environment Ready!"
echo "=========================================="
echo ""
echo "🚀 To start backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "🚀 To start frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "📱 To start iOS app:"
echo "   ./scripts/ios-dev-run.sh"
echo ""
echo "🔑 Login credentials:"
echo "   Email: admin@mindmap.app"
echo "   Password: Admin@123!"
echo ""
echo "📊 Services running:"
echo "   Backend:    http://localhost:4000"
echo "   Frontend:   http://localhost:3000"
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
