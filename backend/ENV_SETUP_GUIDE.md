# Environment Variables Setup Guide

This guide explains where to get each environment variable needed for local development.

## Quick Reference: Where to Get Each Key

| Variable | Required? | Where to Get It |
|----------|-----------|-----------------|
| `JWT_SECRET` | ✅ Yes | Generate locally (see below) |
| `JWT_REFRESH_SECRET` | ✅ Yes | Generate locally (see below) |
| `SUPABASE_URL` | ✅ Yes | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | ✅ Yes | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | Supabase Dashboard → Settings → API |
| `DATABASE_URL` | ✅ Yes | Docker Compose (auto) or Supabase Dashboard |
| `DIRECT_URL` | ✅ Yes | Docker Compose (auto) or Supabase Dashboard |
| `GOOGLE_CLIENT_ID` | ⚠️ Optional | Google Cloud Console (only if using Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | ⚠️ Optional | Google Cloud Console (only if using Google sign-in) |

---

## 1. JWT Secrets (REQUIRED)

**What they are:** Secrets used by the backend to sign and verify JWT tokens for API authentication.

**Why you need them:** Even though you use Supabase, the backend generates its own JWT tokens for API access. Supabase handles user storage, but the backend controls token generation.

**How to generate:**

### Option 1: Using OpenSSL (Recommended)
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

### Option 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Option 3: Online Generator
- Visit: https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" (64 characters) or "Fort Knox Passwords"

**Requirements:**
- Minimum 32 characters
- Use different secrets for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- Keep them secret! Never commit to git.

---

## 2. Supabase Configuration (REQUIRED)

**Where to get them:**

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com/
   - Sign in or create an account

2. **Select or Create Project**
   - If you have a project, select it
   - If not, create a new project (takes a few minutes)

3. **Get API Keys**
   - Go to **Settings** → **API**
   - You'll see:
     - **Project URL** → This is your `SUPABASE_URL`
     - **anon public** key → This is your `SUPABASE_ANON_KEY`
     - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **Keep this secret!**

4. **Get Database Connection String** (if not using Docker Compose)
   - Go to **Settings** → **Database**
   - Under "Connection string", select "URI" or "Connection pooling"
   - Copy the connection string
   - Use it for `DATABASE_URL` and `DIRECT_URL`

**Example:**
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

## 3. Database URLs (REQUIRED)

### Option A: Using Docker Compose (Recommended for Local Dev)

If you're using `docker-compose.yml`, the database URLs are automatically configured:

```env
DATABASE_URL=postgresql://kitchen_hub:kitchen_hub_dev@postgres:5432/kitchen_hub?schema=public
DIRECT_URL=postgresql://kitchen_hub:kitchen_hub_dev@postgres:5432/kitchen_hub?schema=public
```

**Note:** The hostname `postgres` is the service name from docker-compose.yml.

### Option B: Using Supabase Database

If you want to use Supabase's database instead of local Docker:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Copy the connection string
3. Use it for both `DATABASE_URL` and `DIRECT_URL`

**Example:**
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Note:** Replace `[YOUR-PASSWORD]` with your database password (found in Settings → Database).

---

## 4. Google OAuth Credentials (OPTIONAL)

**Only needed if you want Google sign-in functionality.**

**Where to get them:**

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project**
   - Click "Select a project" → "New Project"
   - Give it a name (e.g., "Kitchen Hub")

3. **Enable Google+ API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity API"
   - Click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - If prompted, configure OAuth consent screen first:
     - User Type: External (for testing) or Internal (for Google Workspace)
     - Fill in required fields (App name, support email, etc.)
   - Application type: **Web application**
   - Name: "Kitchen Hub Backend" (or any name)
   - Authorized redirect URIs: 
     - `http://localhost:3000/auth/google/callback` (for local dev)
     - Add production URLs later

5. **Copy Credentials**
   - After creation, you'll see:
     - **Client ID** → This is your `GOOGLE_CLIENT_ID`
     - **Client secret** → This is your `GOOGLE_CLIENT_SECRET`

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
```

**Note:** If you're not using Google sign-in, you can leave these empty or omit them entirely.

---

## 5. Environment-Specific Values

### Development Defaults

These are fine for local development:

```env
NODE_ENV=development
PORT=3000
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Quick Setup Checklist

- [ ] Generate `JWT_SECRET` (32+ characters)
- [ ] Generate `JWT_REFRESH_SECRET` (32+ characters, different from JWT_SECRET)
- [ ] Get `SUPABASE_URL` from Supabase Dashboard
- [ ] Get `SUPABASE_ANON_KEY` from Supabase Dashboard
- [ ] Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard
- [ ] Configure `DATABASE_URL` and `DIRECT_URL` (Docker Compose or Supabase)
- [ ] (Optional) Get `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if using Google sign-in
- [ ] Copy `.env.example` to `.env` and fill in values
- [ ] Verify `.env` is in `.gitignore` (never commit secrets!)

---

## Security Notes

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - It has admin access
3. **Use different JWT secrets for production** - Generate new ones for production
4. **Rotate secrets periodically** - Especially if compromised
5. **Use environment-specific values** - Dev secrets should differ from production

---

## Troubleshooting

### "Invalid JWT_SECRET" error
- Ensure `JWT_SECRET` is at least 32 characters
- Check for extra spaces or quotes in `.env` file

### "Supabase configuration missing" error
- Verify all three Supabase variables are set
- Check for typos in variable names

### Database connection errors
- Verify `DATABASE_URL` format is correct
- For Docker Compose, ensure `postgres` service is running
- For Supabase, check database password is correct

### Google OAuth not working
- Verify OAuth consent screen is configured
- Check redirect URI matches exactly
- Ensure Google+ API is enabled
