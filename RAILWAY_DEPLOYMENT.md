# Railway Deployment Guide

This guide will help you deploy your BookShelf application to Railway.app.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Your code pushed to a Git repository (GitHub, GitLab, etc.)

## Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and click "New Project"
2. Select "Deploy from GitHub repo" (or your preferred Git provider)
3. Choose your BookShelf repository

## Step 2: Add PostgreSQL Database

1. In your Railway project dashboard, click "Add Service"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database and provide connection details

## Step 3: Configure Environment Variables

In your Railway project, go to the "Variables" tab and add these environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://postgres:password@hostname:port/railway
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here
NEXTAUTH_URL=https://your-app-name.railway.app
NODE_ENV=production
```

### Optional Variables (for Google OAuth):
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional Variables (for Analytics Cron Jobs):
```
ANALYTICS_CRON_API_KEY=your-secure-analytics-cron-api-key
```

**Important Notes:**
- The `DATABASE_URL` will be automatically provided by Railway when you add a PostgreSQL service
- Generate a strong `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Replace `your-app-name` in `NEXTAUTH_URL` with your actual Railway app domain

## Step 4: Deploy

1. Railway will automatically detect the `railway.json` configuration
2. It will build using the Dockerfile
3. The first deployment may take 5-10 minutes
4. Once deployed, you'll get a URL like: `https://your-app-name.railway.app`

## Step 5: Database Setup

The application will automatically:
1. Generate Prisma client
2. Run database migrations (`prisma db push`)
3. Start the Next.js application

## Troubleshooting

### Build Issues
- Check the build logs in Railway dashboard
- Ensure all dependencies are listed in `package.json`
- Verify that the `DATABASE_URL` is correctly set

### Database Connection Issues
- Verify PostgreSQL service is running in Railway
- Check that `DATABASE_URL` environment variable is set
- Ensure database is accessible from your application

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set and is a strong random string
- Check that `NEXTAUTH_URL` matches your Railway app domain
- For Google OAuth, ensure redirect URLs are configured in Google Console

## Production Considerations

1. **Monitoring**: Use Railway's built-in metrics and logs
2. **Scaling**: Railway auto-scales based on usage
3. **Custom Domain**: Add your own domain in Railway settings
4. **SSL**: Automatically provided by Railway
5. **Backups**: Consider setting up regular database backups

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Your app's URL | Yes |
| `NODE_ENV` | Environment (production) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `ANALYTICS_CRON_API_KEY` | API key for analytics cron jobs | No |

## Support

If you encounter issues:
1. Check Railway's documentation
2. Review the application logs in Railway dashboard
3. Ensure all environment variables are correctly set
4. Verify your database is running and accessible 