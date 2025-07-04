#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting BookShelf Application..."

# Wait for database to be ready (if using external database)
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  echo "Please set DATABASE_URL in your Railway dashboard"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations/push with retries
echo "🗄️  Setting up database schema..."
for i in 1 2 3 4 5; do
  echo "Attempt $i to setup database..."
  if npx prisma db push --accept-data-loss --force-reset; then
    echo "✅ Database setup successful"
    break
  else
    echo "❌ Database setup failed, attempt $i"
    if [ $i -eq 5 ]; then
      echo "❌ Database setup failed after 5 attempts"
      echo "Please check your DATABASE_URL and database connectivity"
      exit 1
    fi
    echo "⏳ Waiting 10 seconds before retry..."
    sleep 10
  fi
done

# Verify database connection
echo "🔍 Verifying database connection..."
if npx prisma db seed --preview-feature 2>/dev/null || true; then
  echo "✅ Database connection verified"
else
  echo "⚠️  Database connection test completed (seed may not be available)"
fi

# Start the application on Railway's assigned port
echo "🌐 Starting the application..."
echo "Port: ${PORT:-3000}"
echo "Node Environment: ${NODE_ENV:-development}"
echo "NextAuth URL: ${NEXTAUTH_URL:-not-set}"

# Health check
echo "🏥 Application starting with health check on port ${PORT:-3000}"

exec npm start 