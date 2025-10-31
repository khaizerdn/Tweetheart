#!/bin/bash

# SSL Setup Script for Dating App
# This script sets up Let's Encrypt SSL certificates for your domain

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 SSL Certificate Setup Script${NC}"
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Domain name is required${NC}"
    echo "Usage: ./setup-ssl.sh yourdomain.com"
    echo "Example: ./setup-ssl.sh datingapp.example.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@${DOMAIN}}

echo -e "${YELLOW}Domain: ${DOMAIN}${NC}"
echo -e "${YELLOW}Email: ${EMAIL}${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Install Certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Installing Certbot...${NC}"
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Stop the frontend container temporarily
echo -e "${YELLOW}Stopping frontend container...${NC}"
docker compose stop frontend || true

# Create necessary directories
mkdir -p /var/www/certbot
mkdir -p /etc/letsencrypt/live/${DOMAIN} || true

# Use standalone mode for initial certificate
echo -e "${YELLOW}Obtaining SSL certificate...${NC}"
certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email ${EMAIL} \
    -d ${DOMAIN}

# Update nginx-ssl.conf with domain name
echo -e "${YELLOW}Updating Nginx configuration...${NC}"
sed -i "s/server_name _;/server_name ${DOMAIN};/g" nginx-ssl.conf
sed -i "s|/etc/letsencrypt/live/_/|/etc/letsencrypt/live/${DOMAIN}/|g" nginx-ssl.conf

# Copy nginx-ssl.conf to replace nginx.conf
cp nginx-ssl.conf nginx.conf

# Update docker-compose.yml to mount certificates
echo -e "${YELLOW}Updating docker-compose.yml...${NC}"
# This will be done manually or via sed if needed

# Start frontend container
echo -e "${YELLOW}Starting frontend container...${NC}"
docker compose up -d frontend

echo ""
echo -e "${GREEN}✅ SSL certificate setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update docker-compose.yml to mount SSL certificates:"
echo "   volumes:"
echo "     - /etc/letsencrypt:/etc/letsencrypt:ro"
echo "     - /var/www/certbot:/var/www/certbot:ro"
echo ""
echo "2. Update FRONTEND_URL in .env to use https://${DOMAIN}"
echo ""
echo "3. Restart services: docker compose up -d"
echo ""
echo "4. Set up automatic renewal (add to crontab):"
echo "   0 3 * * * certbot renew --quiet --deploy-hook 'docker compose restart frontend'"

