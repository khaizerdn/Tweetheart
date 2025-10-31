# Backend Dockerfile
# Build context should be root directory (.)
FROM node:18-alpine

# Create app structure
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend server
COPY backend/server.js ./

# Copy src directory to maintain ../src relative path structure
# Server.js expects ../src from backend directory
# Since we're at /app (backend), we need /app/../src = /src
COPY src /src

# Copy environment file (optional - env vars from docker-compose take precedence)
COPY backend/.env .env

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

