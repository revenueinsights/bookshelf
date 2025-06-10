# BookShelf - Book Inventory Management

A Next.js application for tracking book market values and organizing your inventory.

## Features

- 📚 Book inventory management
- 💰 Real-time price tracking
- 📊 Analytics and insights
- 🔐 User authentication
- 📱 Responsive design

## Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template)

## Environment Variables

Required environment variables for deployment:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-app.railway.app
NODE_ENV=production
```

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

## Deployment

This app is configured for Railway deployment using Docker.

The `Dockerfile` and `railway.json` are already configured for optimal deployment. 
