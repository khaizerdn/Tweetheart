# Docker Compose Deployment Guide for AWS Lightsail

This guide explains how to deploy your Dating App to AWS Lightsail using Docker Compose.

## 📋 Prerequisites

- AWS Lightsail instance (recommended: 2GB RAM minimum)
- Docker and Docker Compose installed on the instance
- Domain name (optional, for HTTPS)
- AWS S3 bucket configured (already done)

## 🚀 Quick Start

### 1. Prepare Your Environment File

Copy `.env.example` to `.env` and fill in your production values:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

**Important:** Generate strong secrets for:
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- Use strong passwords for database

### 2. Database Options

#### Option A: Use MariaDB Container (Development/Testing)
The `docker-compose.yml` includes a MariaDB container. Good for:
- Testing
- Small deployments
- Quick setup

#### Option B: Use Lightsail Managed Database (Production Recommended)
For production, use AWS Lightsail Managed Database:

1. Create a Lightsail database instance (MariaDB compatible)
2. Update your `.env`:
   ```
   DB_HOST=your-database-endpoint.xxxxx.us-east-1.rds.amazonaws.com
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   ```
3. Comment out the `mariadb` service in `docker-compose.yml`
4. Update the `backend` service `depends_on` to remove `mariadb`

### 3. Build and Deploy

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. Configure Firewall (Security Groups)

In AWS Lightsail:
- Open port **80** (HTTP)
- Open port **443** (HTTPS, if using SSL)
- Open port **3306** only if using external database access (not recommended)

**Internal communication** (backend ↔ database) happens within Docker network, no external ports needed.

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong passwords** - Generate random passwords for all secrets
3. **Use Lightsail Managed Database** - More secure and managed
4. **Configure HTTPS** - Use Lightsail Load Balancer or Let's Encrypt
5. **Limit database access** - Only expose DB port if absolutely necessary

## 🌐 Setting Up HTTPS

### Option 1: Lightsail Load Balancer (Recommended)
1. Create a Lightsail Load Balancer
2. Point your domain to the load balancer
3. Configure SSL certificate in Lightsail
4. Route traffic to your instance on port 80

### Option 2: Let's Encrypt with Certbot
1. Install certbot in a container or on host
2. Configure nginx to serve SSL certificates
3. Update `nginx.conf` to listen on 443

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mariadb
```

### Health Checks
- Backend: `http://your-instance:8081/health`
- Frontend: `http://your-instance/` (served by Nginx)

### Container Status
```bash
docker-compose ps
docker stats
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or restart specific service
docker-compose restart backend
```

### Database Backups
```bash
# Backup MariaDB container
docker-compose exec mariadb mysqldump -u root -p${DB_ROOT_PASSWORD} ${DB_NAME} > backup.sql

# Or use Lightsail managed database backups (automatic)
```

## 🐛 Troubleshooting

### Backend won't start
- Check database connection: `docker-compose logs backend`
- Verify environment variables are set
- Ensure database is healthy: `docker-compose ps`

### Frontend not loading
- Check Nginx logs: `docker-compose logs frontend`
- Verify build completed: Check `dist/` folder
- Check backend connectivity: `docker-compose logs backend`

### Database connection issues
- Verify `DB_HOST` matches your database endpoint
- Check database credentials in `.env`
- Test connection: `docker-compose exec backend ping mariadb` (if using container)

### Socket.io not working
- Ensure WebSocket support in load balancer (if using)
- Check CORS settings in `backend/server.js`
- Verify `FRONTEND_URL` matches your actual frontend URL

## 📦 Production Overrides

Use production-specific settings:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

This will:
- Bind database to localhost only
- Use production environment variables
- Apply production optimizations

## 🎯 Architecture Summary

```
┌─────────────────────────────────────────┐
│  AWS Lightsail Instance                 │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   Frontend   │  │   Backend    │    │
│  │   (Nginx)    │◄─┤  (Node.js)   │    │
│  │   Port 80    │  │  Port 8081   │    │
│  └──────────────┘  └──────────────┘    │
│                          │               │
│  ┌──────────────┐        │               │
│  │   MariaDB    │◄───────┘               │
│  │  (Internal)  │                        │
│  └──────────────┘                        │
└─────────────────────────────────────────┘
            │
            ▼
    ┌──────────────┐
    │   AWS S3     │
    │  (Photos)    │
    └──────────────┘
```

## 📝 Environment Variables Reference

See `.env.example` for all required variables. Key ones:

- `FRONTEND_URL`: Your frontend domain (for CORS)
- `DB_HOST`: Database endpoint
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`: JWT secrets
- AWS S3 credentials: Already configured

## 🔗 Additional Resources

- [AWS Lightsail Documentation](https://docs.aws.amazon.com/lightsail/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MariaDB Docker Hub](https://hub.docker.com/_/mariadb)

