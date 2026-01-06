# Railway Deployment Guide for Codocs

This guide will walk you through deploying Codocs to Railway. Railway is perfect for this app because it supports WebSockets, making real-time chat and collaborative editing work out of the box!

## ✅ Why Railway?

- ✅ **Full WebSocket Support** - Socket.IO and y-websocket work perfectly
- ✅ **Simple Deployment** - Just connect GitHub and deploy
- ✅ **Free Tier Available** - $5 credit monthly
- ✅ **Automatic HTTPS** - SSL certificates included
- ✅ **Easy Environment Variables** - Set them in the dashboard
- ✅ **MongoDB Integration** - Can add MongoDB as a service

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app) (free to start)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) (free tier available)
3. **GitHub Account**: Your code needs to be on GitHub
4. **Google OAuth Credentials** (optional, if using Google login)

## Step 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster (free tier M0 is fine)
3. Create a database user:
   - Go to "Database Access" → "Add New Database User"
   - Choose "Password" authentication
   - Create a strong password and save it
4. Whitelist IP addresses:
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - Or add Railway's IP ranges if you prefer
5. Get your connection string:
   - Go to "Clusters" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `codocs` (or your preferred database name)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/codocs?retryWrites=true&w=majority`

## Step 2: Set Up Google OAuth (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure:
   - Application type: Web application
   - Name: Codocs
   - Authorized JavaScript origins: `https://your-app.railway.app` (you'll update this after deployment)
   - Authorized redirect URIs: `https://your-app.railway.app/api/auth/google/callback`
6. Save the Client ID and Client Secret

## Step 3: Prepare Your Code

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## Step 4: Deploy to Railway

### Option A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**:
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect it's a Node.js project

3. **Configure Build Settings**:
   - Railway will automatically detect the build process
   - It will run `npm install` and `npm run build` (builds the frontend)
   - Then run `npm start` (starts the server)

4. **Set Environment Variables**:
   - Go to your project → "Variables" tab
   - Add the following variables:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `MONGO_URI` | Your MongoDB connection string | From Step 1 |
   | `JWT_SECRET` | Random string | Generate with: `openssl rand -base64 32` |
   | `SESSION_SECRET` | Random string | Generate with: `openssl rand -base64 32` |
   | `NODE_ENV` | `production` | |
   | `PORT` | (auto-set by Railway) | Railway sets this automatically |
   | `FRONTEND_URL` | Your Railway URL | Will be something like `https://your-app.railway.app` |
   | `VITE_API_URL` | Your Railway URL | Same as FRONTEND_URL |
   | `VITE_WS_URL` | Your Railway WebSocket URL | `wss://your-app.railway.app` (Railway handles this automatically) |
   | `GOOGLE_CLIENT_ID` | Your Google Client ID | From Step 2 (if using Google login) |
   | `GOOGLE_CLIENT_SECRET` | Your Google Client Secret | From Step 2 (if using Google login) |
   | `GOOGLE_CALLBACK_URL` | `https://your-app.railway.app/api/auth/google/callback` | Update after deployment |

5. **Deploy**:
   - Railway will automatically start building and deploying
   - Watch the build logs in the dashboard
   - Once deployed, you'll get a URL like `https://your-app.railway.app`

6. **Update Google OAuth** (if using):
   - Go back to Google Cloud Console
   - Update authorized redirect URIs with your actual Railway URL
   - Update `GOOGLE_CALLBACK_URL` environment variable in Railway

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   cd /Users/mrigas/codocs
   railway init
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set MONGO_URI="your-mongodb-connection-string"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set SESSION_SECRET="your-session-secret"
   railway variables set NODE_ENV="production"
   railway variables set FRONTEND_URL="https://your-app.railway.app"
   railway variables set VITE_API_URL="https://your-app.railway.app"
   railway variables set VITE_WS_URL="wss://your-app.railway.app"
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

## Step 5: Configure Custom Domain (Optional)

1. Go to your project → "Settings" → "Domains"
2. Click "Generate Domain" or "Add Custom Domain"
3. Railway will provide SSL certificates automatically

## Step 6: Test Your Deployment

1. Visit your Railway URL
2. Test user registration/login
3. Test room creation
4. Test real-time chat (should work!)
5. Test collaborative editing (should work!)

## How It Works

Railway will:
1. Install dependencies for both client and server
2. Build the React frontend (`npm run build` in root)
3. Start the Express server (`npm start` in root)
4. The server serves the built frontend static files
5. All API routes work normally
6. WebSockets work perfectly (Socket.IO and y-websocket)

## Environment Variables Reference

### Required Variables

- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT tokens (generate random string)
- `SESSION_SECRET` - Secret for sessions (generate random string)
- `NODE_ENV` - Set to `production`

### Optional Variables

- `FRONTEND_URL` - Your Railway deployment URL
- `VITE_API_URL` - Same as FRONTEND_URL (for frontend API calls)
- `VITE_WS_URL` - WebSocket URL (Railway handles this automatically)
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `GOOGLE_CALLBACK_URL` - OAuth callback URL

### Auto-Set by Railway

- `PORT` - Railway sets this automatically (don't set manually)

## Troubleshooting

### Build Fails

**"Module not found"**
- Make sure all dependencies are in `package.json` files
- Check that both `client/package.json` and `server/package.json` have all dependencies

**"Build command failed"**
- Check build logs in Railway dashboard
- Make sure `npm run build` works locally first
- Verify Node.js version (Railway uses Node 18+)

### Runtime Errors

**"MongoDB connection failed"**
- Verify `MONGO_URI` is set correctly
- Check MongoDB Atlas IP whitelist
- Verify database user credentials

**"WebSocket connection failed"**
- Railway supports WebSockets automatically
- Make sure you're using `wss://` (secure WebSocket) in production
- Check that `VITE_WS_URL` is set correctly

**"CORS errors"**
- Make sure `FRONTEND_URL` is set correctly
- Check CORS configuration in `server/index.js`

### Port Issues

- Railway automatically sets the `PORT` environment variable
- Don't hardcode port numbers
- The server uses `process.env.PORT || 3001`

## Monitoring

- **Logs**: View real-time logs in Railway dashboard
- **Metrics**: Check CPU, memory usage in dashboard
- **Deployments**: See deployment history and rollback if needed

## Scaling

Railway automatically handles:
- Load balancing
- HTTPS/SSL certificates
- Health checks
- Automatic restarts

## Cost

- **Free Tier**: $5 credit monthly (enough for small projects)
- **Hobby Plan**: $5/month (if you exceed free tier)
- **Pro Plan**: $20/month (for production apps)

## Next Steps

1. ✅ Test all features
2. ✅ Set up custom domain (optional)
3. ✅ Configure monitoring/alerts
4. ✅ Set up backups for MongoDB

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Check Railway dashboard logs for detailed error messages

---

**That's it!** Your app should now be live on Railway with full WebSocket support! 🚀

