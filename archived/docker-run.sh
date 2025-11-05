#!/bin/bash
# Helper script to run Docker commands with proper PATH setup for Git Bash on Windows

# Add Docker to PATH if not already there
export PATH="/c/Program Files/Docker/Docker/resources/bin:$PATH"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not found. Please make sure Docker Desktop is running."
    exit 1
fi

# Run the provided command
"$@"

