#!/bin/bash

# Exit on any error
set -e

# Pull the latest changes from the repository
echo "Pulling latest changes from Git..."
git pull

# Install dependencies
echo "Installing dependencies with pnpm..."
pnpm install

# Build the project
echo "Building the project..."
pnpm build

# Copy everything from the 'dist' directory to the parent directory
echo "Copying files from 'dist' to the parent directory..."
cp -r dist/* ../

# Optional: Clean up the 'dist' directory after copying
# rm -rf dist

echo "Deployment completed successfully!"
