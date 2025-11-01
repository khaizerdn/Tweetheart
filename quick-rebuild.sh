#!/bin/bash
# Quick rebuild script for Docker frontend (faster than manual commands)
# Use this when you want to test the Docker-built version

echo "🔨 Rebuilding frontend container..."
./docker-run.sh docker compose build frontend

echo "🔄 Restarting frontend..."
./docker-run.sh docker compose restart frontend

echo "✅ Done! Frontend rebuilt and restarted."
echo "Access at: http://localhost:3000"
echo ""
echo "Checking status..."
./docker-run.sh docker compose ps frontend

