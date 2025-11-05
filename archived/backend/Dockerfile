# Backend Dockerfile
# Build context should be root directory (.)
FROM node:18-alpine

# Create app structure
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy backend server (verify it's the new version)
COPY backend/server.js ./
RUN head -3 server.js && echo "---" && grep -c "BACKEND SERVER.JS STARTING" server.js || echo "OLD VERSION - NO STARTUP MESSAGE"

# Copy src directory to /app/src (relative to server.js)
# This allows relative imports to work properly with ES modules
COPY src ./src

# Create package.json in /app/src for ES module resolution
RUN echo '{"type":"module"}' > ./src/package.json

# Create .mjs copies of all server.js files
# Node.js recognizes .mjs files as ES modules automatically (no package.json needed)
RUN find ./src -name "server.js" -type f -exec sh -c 'cp "$1" "${1%.js}.mjs" && echo "Created: ${1%.js}.mjs"' _ {} \; && \
    echo "=== Verification: Listing .mjs files ===" && \
    find ./src -name "server.mjs" -type f | head -5

# Note: Environment variables are provided by docker-compose.yml
# No need to copy .env file - all vars come from docker-compose environment section

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8081/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "server.js"]

