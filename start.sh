#!/bin/sh

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run database migrations/push
echo "Setting up database schema..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting the application..."
npm start 