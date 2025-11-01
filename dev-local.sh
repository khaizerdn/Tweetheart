#!/bin/bash
# Quick script to run Vite dev server with hot reload for local development
# Backend must be running in Docker (docker compose up backend mariadb)

echo "🚀 Starting Vite Dev Server with Hot Reload..."
echo "📝 Make sure Docker backend is running: docker compose up -d backend mariadb"
echo ""
echo "Frontend will be available at: http://localhost:5173"
echo "Changes will appear instantly (hot reload enabled)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Set API URL for development
export VITE_API_URL=http://localhost:8081/api

# Run Vite dev server
npm run dev

