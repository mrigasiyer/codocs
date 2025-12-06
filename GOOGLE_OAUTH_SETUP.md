# Google OAuth Setup Guide

## Current Issue

Google login is not working because OAuth credentials are not configured.

## Steps to Fix

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: Codocs
   - User support email: Your email
   - Developer contact: Your email
6. Create OAuth Client ID:
   - Application type: Web application
   - Name: Codocs
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - `http://localhost:3001`
   - Authorized redirect URIs:
     - `http://localhost:3001/api/auth/google/callback`
7. Copy the **Client ID** and **Client Secret**

### 2. Create Environment File

Create a file named `.env` in the `server/` directory:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Secrets
JWT_SECRET=your-secret-key-for-now
SESSION_SECRET=your-session-secret
```

### 3. Update server/index.js to load .env

The server needs to load environment variables. Add this at the top of `server/index.js`:

```javascript
require("dotenv").config();
```

### 4. Install dotenv

```bash
cd server
npm install dotenv
```

### 5. Restart the Server

After adding the credentials and installing dotenv, restart your server:

```bash
npm start
```

## Testing

1. Go to the login page
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth consent screen
4. After approving, you'll be logged in and redirected back to the app

## Troubleshooting

### "redirect_uri_mismatch" error

- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3001/api/auth/google/callback`

### "Access blocked: This app's request is invalid"

- Complete the OAuth consent screen configuration
- Add your email as a test user if the app is in testing mode

### "OAuth error" in the app

- Check the server console for detailed error messages
- Verify your Client ID and Secret are correct
- Make sure `.env` file is in the `server/` directory

