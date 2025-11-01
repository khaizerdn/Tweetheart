# Quick Start: Running Docker Compose Locally

## ✅ Your Docker Compose is Now Running!

All services are up and running. Here's how to access them:

### 🌐 Access Your Services

- **Frontend (React App)**: http://localhost
- **Backend API**: http://localhost/api (proxied through nginx)
- **Backend Direct**: http://localhost:8081
- **phpMyAdmin**: http://localhost:8080
- **MariaDB**: localhost:3306

### 🔧 Running Docker Commands

Since you're using Git Bash, you need to add Docker to your PATH. You have two options:

#### Option 1: Use the Helper Script
```bash
./docker-run.sh docker compose ps
./docker-run.sh docker compose logs -f
./docker-run.sh docker compose down
```

#### Option 2: Export PATH Each Time
```bash
export PATH="/c/Program Files/Docker/Docker/resources/bin:$PATH"
docker compose ps
docker compose logs -f
```

#### Option 3: Add to Your Bash Profile (Permanent)
Add this line to your `~/.bashrc` or `~/.bash_profile`:
```bash
export PATH="/c/Program Files/Docker/Docker/resources/bin:$PATH"
```

### 📋 Common Commands

```bash
# View running containers
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs for specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mariadb

# Stop all services
docker compose down

# Stop and remove volumes (clears database)
docker compose down -v

# Rebuild and restart
docker compose up --build -d

# Restart a specific service
docker compose restart backend
```

### 🐛 Troubleshooting

**Port already in use?**
- Check what's using the port: `netstat -ano | findstr :80`
- Change the port in `docker-compose.yml` if needed

**Database not working?**
- Check logs: `docker compose logs mariadb`
- The database initializes automatically from `init.sql` on first start

**Need to reset everything?**
```bash
docker compose down -v
docker compose up --build -d
```

### 📝 Notes

- Docker Desktop must be running before using Docker commands
- First build takes longer as it downloads images
- Database data persists in Docker volumes even after stopping containers
- Use `docker compose down -v` to completely remove database data

