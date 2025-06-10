#!/bin/sh

# Exit on any error
set -e

# Wait for database to be ready (if using external database)
echo "Waiting for database to be ready..."
sleep 5

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations/push with retries
echo "Setting up database schema..."
for i in 1 2 3; do
  echo "Attempt $i to setup database..."
  if npx prisma db push --accept-data-loss; then
    echo "✅ Database setup successful"
    break
  else
    echo "❌ Database setup failed, attempt $i"
    if [ $i -eq 3 ]; then
      echo "❌ Database setup failed after 3 attempts"
      exit 1
    fi
    sleep 5
  fi
done

# Start the application on Railway's assigned port
echo "Starting the application on port ${PORT:-3000}..."
echo "NODE_ENV: ${NODE_ENV}"
echo "NEXTAUTH_URL: ${NEXTAUTH_URL}"

exec npm start 