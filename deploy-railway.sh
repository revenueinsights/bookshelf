#!/bin/bash

# Railway Deployment Script for BookShelf App
# This script helps you deploy your BookShelf application to Railway.app

set -e

echo "🚀 Railway Deployment Script for BookShelf"
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Installing Railway CLI..."
    if command -v brew &> /dev/null; then
        echo "Using Homebrew to install Railway CLI..."
        brew install railway
    else
        echo "Please install Railway CLI manually:"
        echo "Option 1: brew install railway"
        echo "Option 2: npm install -g @railway/cli (may need sudo)"
        echo "Then run this script again."
        exit 1
    fi
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "❌ You are not logged into Railway."
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and you are logged in."

# Generate NEXTAUTH_SECRET if not provided
echo ""
echo "🔐 Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
echo "Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"

# Create Railway project (if not already in one)
echo ""
echo "📦 Setting up Railway project..."

# Check if we're already in a Railway project
if [ ! -f "railway.json" ] || ! railway status &> /dev/null; then
    echo "Creating new Railway project..."
    railway init
else
    echo "Already in a Railway project."
fi

# Add PostgreSQL service
echo ""
echo "🗄️  Adding PostgreSQL database..."
railway add --database postgres || echo "PostgreSQL may already be added"

# Set environment variables using the correct syntax
echo ""
echo "⚙️  Setting environment variables..."
railway variables --set "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
railway variables --set "NODE_ENV=production"

# Generate analytics cron API key
ANALYTICS_CRON_API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables --set "ANALYTICS_CRON_API_KEY=$ANALYTICS_CRON_API_KEY"

# Get Railway domain (this might not work immediately, so we'll handle it gracefully)
echo ""
echo "🌐 Setting up NEXTAUTH_URL..."
echo "⚠️  You'll need to set NEXTAUTH_URL manually after deployment."
echo "Go to your Railway dashboard and set:"
echo "NEXTAUTH_URL=https://your-app-name.railway.app"

echo ""
echo "🎯 Optional: Set up Google OAuth"
echo "If you want to enable Google sign-in, set these variables in Railway dashboard:"
echo "- GOOGLE_CLIENT_ID=your-google-client-id"
echo "- GOOGLE_CLIENT_SECRET=your-google-client-secret"

# Deploy the application
echo ""
echo "🚀 Deploying to Railway..."
railway up --detach

echo ""
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next steps:"
echo "1. Check the deployment status: railway status"
echo "2. View logs: railway logs"
echo "3. Open your app: railway open"
echo "4. Set NEXTAUTH_URL in Railway dashboard to your app's URL"
echo "5. If you want Google OAuth, add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
echo ""
echo "🔧 Useful Railway commands:"
echo "- railway logs      # View application logs"
echo "- railway open      # Open your deployed app"
echo "- railway status    # Check deployment status"
echo "- railway variables # View/manage environment variables"
echo ""
echo "🎉 Happy book tracking!" 