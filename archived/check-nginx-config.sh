#!/bin/bash
# Diagnostic script to check nginx configuration in running container

echo "=== Checking Frontend Container Status ==="
docker compose ps frontend

echo ""
echo "=== Checking Nginx Config Inside Container ==="
docker compose exec frontend cat /etc/nginx/conf.d/default.conf | grep -A 1 "Content-Security-Policy" || echo "CSP not found or container not running"

echo ""
echo "=== Checking Which Nginx File Dockerfile Uses ==="
docker compose exec frontend ls -la /etc/nginx/conf.d/

echo ""
echo "=== Checking Built Frontend Files ==="
docker compose exec frontend ls -la /usr/share/nginx/html/ | head -10

echo ""
echo "=== Checking .env VITE_API_URL ==="
grep VITE_API_URL .env || echo "VITE_API_URL not found in .env"

