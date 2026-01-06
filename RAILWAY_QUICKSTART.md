# Railway Quick Start Guide

## 🚀 Fastest Path to Deployment (10 minutes)

### 1. Set Up MongoDB Atlas (3 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user (Database Access → Add New Database User)
4. Whitelist IP: Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
5. Get connection string: Clusters → Connect → Connect your application
   - Replace `<password>` with your password
   - Replace `<dbname>` with `codocs`

### 2. Push Code to GitHub (2 minutes)

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 3. Deploy to Railway (5 minutes)

1. **Go to [railway.app](https://railway.app)** and sign in with GitHub

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add Environment Variables**:
   - Go to your project → "Variables" tab
   - Add these variables:

   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/codocs?retryWrites=true&w=majority
   JWT_SECRET=<generate with: openssl rand -base64 32>
   SESSION_SECRET=<generate with: openssl rand -base64 32>
   NODE_ENV=production
   ```

4. **Wait for Deployment**:
   - Railway will automatically build and deploy
   - You'll get a URL like `https://your-app.railway.app`

5. **Update FRONTEND_URL**:
   - After deployment, add this variable:
   ```
   FRONTEND_URL=https://your-app.railway.app
   VITE_API_URL=https://your-app.railway.app
   VITE_WS_URL=wss://your-app.railway.app
   ```
   - Railway will redeploy automatically

### 4. Test (1 minute)

Visit your Railway URL and test:
- ✅ User registration/login
- ✅ Room creation
- ✅ Real-time chat (works!)
- ✅ Collaborative editing (works!)

## 🎉 That's It!

Your app is now live with full WebSocket support!

## Optional: Google OAuth

If you want Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth credentials
3. Add to Railway:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL=https://your-app.railway.app/api/auth/google/callback`
4. Update Google Console redirect URIs with your Railway URL

## Troubleshooting

**Build fails?**
- Check Railway logs
- Make sure all dependencies are in package.json

**MongoDB connection fails?**
- Verify MONGO_URI is correct
- Check IP whitelist in MongoDB Atlas

**WebSockets not working?**
- Make sure VITE_WS_URL uses `wss://` (not `ws://`)
- Railway handles this automatically

For detailed instructions, see `RAILWAY_DEPLOYMENT.md`.

