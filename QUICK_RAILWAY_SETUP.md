# Quick Railway Setup Guide

Since you already have Railway CLI installed and a project created, here's how to complete the setup:

## Current Status ✅
- ✅ Railway CLI installed
- ✅ Logged into Railway 
- ✅ Project created: `bookshelf-kp`
- ✅ PostgreSQL database added

## Next Steps

### 1. Set Environment Variables

```bash
# Generate and set NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(node generate-secret.js | grep -v "🔐\|📝\|⚠️")
railway variables --set "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"

# Set other required variables
railway variables --set "NODE_ENV=production"

# Generate analytics API key
ANALYTICS_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
railway variables --set "ANALYTICS_CRON_API_KEY=$ANALYTICS_KEY"
```

### 2. Deploy the Application

```bash
# Deploy to Railway
railway up
```

### 3. Set NEXTAUTH_URL After Deployment

```bash
# After deployment, get your app URL
railway domain

# Then set the NEXTAUTH_URL (replace with your actual domain)
railway variables --set "NEXTAUTH_URL=https://your-app-domain.railway.app"
```

### 4. Optional: Add Google OAuth

If you want Google sign-in, add these in Railway dashboard or via CLI:

```bash
railway variables --set "GOOGLE_CLIENT_ID=your-google-client-id"
railway variables --set "GOOGLE_CLIENT_SECRET=your-google-client-secret"
```

## Useful Commands

```bash
# View deployment status
railway status

# View logs
railway logs

# Open your app in browser
railway open

# View/manage environment variables
railway variables

# Redeploy
railway redeploy
```

## Troubleshooting

### If build fails:
```bash
# Check logs
railway logs

# Common issues:
# 1. DATABASE_URL not set (should be automatic with PostgreSQL service)
# 2. NEXTAUTH_SECRET not set properly
# 3. Build dependencies missing
```

### If database connection fails:
```bash
# Check if PostgreSQL service is running
railway status

# Check environment variables
railway variables
```

### Manual Environment Variable Setup via Dashboard

1. Go to https://railway.com/project/cfe4d8fa-d174-4113-90e4-96ecef7bc76c
2. Click on your service
3. Go to "Variables" tab
4. Add:
   - `NEXTAUTH_SECRET` = (generate with `node generate-secret.js`)
   - `NEXTAUTH_URL` = https://your-app-domain.railway.app
   - `NODE_ENV` = production
   - `ANALYTICS_CRON_API_KEY` = (random 64-char hex string)

## Next Steps After Deployment

1. ✅ Test the app works: `railway open`
2. ✅ Create a user account
3. ✅ Add a book to test database connectivity
4. ✅ Check logs for any errors: `railway logs`
5. ✅ Set up custom domain (optional)

Your app should be accessible at the Railway-provided domain once deployment completes! 