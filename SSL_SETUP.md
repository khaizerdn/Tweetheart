# SSL/HTTPS Setup Guide

This guide will help you set up HTTPS/SSL for your Dating App using Let's Encrypt.

## Prerequisites

1. A domain name pointing to your AWS Lightsail instance IP
2. DNS A record configured (e.g., `tweetheart.xyz` → `YOUR_LIGHTSAIL_IP`)
3. Ports 80 and 443 open in your Lightsail firewall
4. SSH access to your server

## Step 1: Configure DNS

Make sure your domain points to your Lightsail IP:

```
Type: A
Name: @ (or your subdomain like 'app')
Value: YOUR_LIGHTSAIL_IP (replace with your actual Lightsail IP)
TTL: 300 (or default)
```

Verify DNS propagation:
```bash
dig tweetheart.xyz
# or
nslookup tweetheart.xyz
```

## Step 2: Open Ports in Lightsail

1. Go to AWS Lightsail Console
2. Select your instance
3. Go to Networking tab
4. Click "Add rule"
5. Add:
   - **HTTP**: Port 80, TCP
   - **HTTPS**: Port 443, TCP

## Step 3: Install Certbot

On your Lightsail server:

```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

## Step 4: Stop Frontend Container

```bash
cd ~/Tweetheart  # or your project directory
docker compose stop frontend
```

## Step 5: Obtain SSL Certificate

```bash
# Use your domain tweetheart.xyz
sudo certbot certonly --standalone -d tweetheart.xyz --email your-email@example.com --agree-tos --non-interactive
```

**Example:**
```bash
sudo certbot certonly --standalone -d tweetheart.xyz --email admin@tweetheart.xyz --agree-tos --non-interactive
```

## Step 6: Update Configuration Files

### Update nginx-ssl.conf

Replace `_` with your domain name in `nginx-ssl.conf`:

```bash
sed -i 's/server_name _;/server_name tweetheart.xyz;/g' nginx-ssl.conf
sed -i 's|/etc/letsencrypt/live/_/|/etc/letsencrypt/live/tweetheart.xyz/|g' nginx-ssl.conf
```

### Replace nginx.conf

```bash
cp nginx-ssl.conf nginx.conf
```

### Update docker-compose.yml

Add volumes to mount SSL certificates in the `frontend` service:

```yaml
frontend:
  build:
    context: .
    dockerfile: Dockerfile
    args:
      VITE_API_URL: ${VITE_API_URL:-/api}
  container_name: dating-app-frontend
  restart: unless-stopped
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
    - /var/www/certbot:/var/www/certbot:ro
  depends_on:
    - backend
  networks:
    - app-network
```

### Update .env file

Update `FRONTEND_URL` to use HTTPS:

```bash
# In your .env file
FRONTEND_URL=https://tweetheart.xyz
```

## Step 7: Rebuild and Start Services

```bash
# Rebuild frontend with updated nginx config
docker compose build --no-cache frontend

# Start all services
docker compose up -d

# Check logs
docker compose logs frontend | tail -20
```

## Step 8: Verify HTTPS

1. Open your browser and go to `https://tweetheart.xyz`
2. You should see a padlock icon indicating secure connection
3. Test geolocation - it should work now!

## Step 9: Set Up Automatic Certificate Renewal

Certificates expire every 90 days. Set up auto-renewal:

```bash
# Edit crontab
sudo crontab -e

# Add this line (runs daily at 3 AM)
0 3 * * * certbot renew --quiet --deploy-hook 'cd /home/ubuntu/Tweetheart && docker compose restart frontend'
```

Or use systemd timer (recommended):

```bash
# Create renewal script
sudo nano /etc/cron.daily/certbot-renewal

# Add:
#!/bin/bash
certbot renew --quiet --deploy-hook 'cd /home/ubuntu/Tweetheart && docker compose restart frontend'

# Make executable
sudo chmod +x /etc/cron.daily/certbot-renewal
```

## Troubleshooting

### Certificate renewal fails

If renewal fails, you may need to stop the frontend container during renewal:

```bash
certbot renew --pre-hook 'docker compose stop frontend' --post-hook 'docker compose start frontend'
```

### Port 80 already in use

If port 80 is in use during certificate request:
```bash
# Stop nginx/frontend
docker compose stop frontend

# Get certificate
sudo certbot certonly --standalone -d tweetheart.xyz

# Start frontend
docker compose start frontend
```

### Check certificate expiration

```bash
sudo certbot certificates
```

### Test SSL configuration

```bash
# From outside your server
curl -I https://tweetheart.xyz

# Check SSL details
openssl s_client -connect tweetheart.xyz:443
```

## Security Best Practices

1. ✅ Use strong SSL configuration (already in nginx-ssl.conf)
2. ✅ Enable HSTS (already configured)
3. ✅ Keep Certbot updated: `sudo apt-get update && sudo apt-get upgrade certbot`
4. ✅ Monitor certificate expiration
5. ✅ Use security headers (already configured)

## Next Steps

After SSL is set up:
1. Update any hardcoded HTTP URLs in your code to HTTPS
2. Test all API endpoints work over HTTPS
3. Verify Socket.io works over HTTPS (WSS)
4. Update cookie settings to use `Secure` flag in production

