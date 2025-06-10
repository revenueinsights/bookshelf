#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations/push
echo "Setting up database schema..."
npx prisma db push --accept-data-loss

# Start the application on the correct port
echo "Starting the application on port ${PORT:-3000}..."
npm start 