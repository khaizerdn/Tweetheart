# Local Development Guide

This guide explains how to develop and test locally without affecting your AWS Lightsail production deployment.

## 🎯 How It Works

**No Conflicts!** Your local machine and AWS Lightsail are completely separate:

1. **Local Changes** → Stay on your machine until you `git commit` and `git push`
2. **Production (Lightsail)** → Only updates when you run `git pull` on the server
3. **Test Locally** → Make changes, test them, then push when ready

## 🚀 Quick Start: Local Development

### Step 1: Create Local .env File

Your current `.env` has production settings. Create a **local-only** `.env` file:

```bash
# Copy the example and modify for local use
cp .env.example .env.local
```

Or manually create `.env.local` with these settings:

```env
# Local Development Configuration
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:8081

# Database (uses Docker container)
DB_HOST=mariadb
DB_USER=appuser
DB_PASSWORD=apppassword
DB_NAME=tweetheart
DB_PORT=3306
DB_ROOT_PASSWORD=rootpassword

# Use your existing secrets (or generate new ones for local)
ACCESS_TOKEN_SECRET=Mx2JSE=hw7BY`gT&=kU9<~!,z^$$*qvrNuW53:-DHp/V+c42_yQx%sLa@6
REFRESH_TOKEN_SECRET=RdBg`43Q.GjLZezr$$hX9tv%HUycJ?k6wnMsECa7/Sp2>:bA@TK
BCRYPT_ROUNDS=12

# Email (use your existing or a test account)
EMAIL_USER=khaizerdn@gmail.com
EMAIL_PASS=xfth xjta yrjr ufvq

# AWS S3 (use your existing credentials from .env, or create a test bucket)
BUCKET_NAME=your-bucket-name
BUCKET_REGION=ap-southeast-2
ACCESS_KEY=your-aws-access-key
SECRET_ACCESS_KEY=your-aws-secret-key
```

**Important:** `.env.local` should be in `.gitignore` (it already is), so it won't be committed.

### Step 2: Run Docker Compose Locally

```bash
# Start all services (uses your local .env or docker-compose.yml defaults)
docker compose up -d

# Or use the helper script if on Windows Git Bash
./docker-run.sh docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

### Step 3: Access Your Local App

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Backend Direct**: http://localhost:8081
- **phpMyAdmin**: http://localhost:8080

## 📝 Development Workflow

### Making Changes Locally

1. **Edit files** (UI, code, etc.)
2. **Rebuild frontend** if you changed frontend code:
   ```bash
   docker compose build frontend
   docker compose restart frontend
   ```
3. **Restart backend** if you changed backend code:
   ```bash
   docker compose restart backend
   ```
4. **Test your changes** at http://localhost

### For Fast Frontend Development (Hot Reload)

If you want hot reload (changes appear instantly without rebuild), run Vite dev server:

```bash
# Install dependencies (if not done)
npm install

# Run Vite dev server
npm run dev

# Access at http://localhost:5173
# Backend still runs via Docker at http://localhost:8081
```

Then set `VITE_API_URL=http://localhost:8081` in your local environment.

## 🚢 Deploying Changes to Production

### When You're Ready to Deploy

1. **Test everything locally** first
2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```
3. **On AWS Lightsail**, pull and rebuild:
   ```bash
   ssh ubuntu@YOUR_LIGHTSAIL_IP
   cd ~/Tweetheart
   git pull origin main
   docker compose build frontend  # or backend if needed
   docker compose restart frontend  # or backend
   ```

### Safe Deployment Checklist

- ✅ Tested locally
- ✅ All changes committed
- ✅ No production secrets in committed files
- ✅ Pulled latest on server before deploying
- ✅ Backed up database (optional but recommended)

## 🔄 Handling Conflicts

If you see conflicts when pulling on Lightsail:

1. **On Lightsail**, stash local changes:
   ```bash
   git stash
   git pull origin main
   ```

2. **Or discard local changes** (if not important):
   ```bash
   git checkout -- filename
   git pull origin main
   ```

## 🎨 UI Changes Workflow

1. **Edit CSS/JSX files** locally
2. **Test in browser** at http://localhost
3. **When satisfied**, commit and push
4. **Deploy** on Lightsail:
   ```bash
   git pull origin main
   docker compose build --no-cache frontend
   docker compose restart frontend
   ```

## 🔒 Important Notes

### .env Files

- **`.env`** → Your current production settings (can be committed if not sensitive)
- **`.env.local`** → Local development (should be in .gitignore - already is)
- **AWS Lightsail `.env`** → Production settings on server (never commit)

### Docker Volumes

- **Local**: Uses `mariadb_data` volume - separate from production
- **Production**: Uses its own volume on Lightsail
- They don't interfere with each other!

### Database

- **Local**: Fresh database in Docker container
- **Production**: Your live database on Lightsail
- They're completely separate - test freely!

## 🛠️ Common Commands

### Local Development

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f

# Rebuild after code changes
docker compose build frontend
docker compose restart frontend

# Stop everything
docker compose down

# Reset database
docker compose down -v
docker compose up -d
```

### Production Deployment

```bash
# SSH to Lightsail
ssh ubuntu@YOUR_IP

# Update code
cd ~/Tweetheart
git pull origin main

# Rebuild if needed
docker compose build --no-cache frontend

# Restart services
docker compose restart frontend
docker compose restart backend

# Check status
docker compose ps
docker compose logs frontend --tail=50
```

## 🎯 Best Practices

1. **Always test locally first**
2. **Commit small, logical changes** (easier to rollback if needed)
3. **Use descriptive commit messages**
4. **Don't commit `.env.local`** (already in .gitignore)
5. **Pull on server before deploying** to avoid conflicts

## 📚 Need Help?

- Local setup issues? See `DOCKER_QUICK_START.md`
- Deployment issues? See `DEPLOYMENT.md`
- SSL/HTTPS issues? See `SSL_SETUP.md`

