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

# Copy src directory to /app/src (relative to server.js)
# This allows relative imports to work properly with ES modules
COPY src ./src

# Create package.json files in /app/src and all subdirectories for ES module resolution
# Node.js looks for package.json in the file's directory and parent directories
RUN echo '{"type":"module"}' > ./src/package.json && \
    find ./src -type d -exec sh -c 'echo "{\"type\":\"module\"}" > "$1/package.json"' _ {} \;

# Note: Environment variables are provided by docker-compose.yml
# No need to copy .env file - all vars come from docker-compose environment section

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

