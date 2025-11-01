# Frontend Dockerfile (Multi-stage build)
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build argument for VITE_API_URL
ARG VITE_API_URL=http://localhost:8081
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app (VITE_API_URL will be embedded)
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration (use nginx-ssl.conf for HTTPS, nginx.conf for HTTP)
# After SSL certificates are obtained, switch to nginx-ssl.conf
COPY nginx-ssl.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

