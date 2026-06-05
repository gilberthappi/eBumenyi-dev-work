#!/bin/bash

set -e

# This hook runs before EAS build process
# Decode base64 google-services.json from EAS environment variable and place it in the correct location

echo "🔧 EAS Build Pre-Install Hook Starting..."
echo "Current directory: $(pwd)"
echo "GOOGLE_SERVICES_JSON length: ${#GOOGLE_SERVICES_JSON}"

if [ -z "$GOOGLE_SERVICES_JSON" ]; then
  echo "❌ GOOGLE_SERVICES_JSON environment variable not found"
  echo "Available environment variables:"
  env | grep -i google || true
  exit 1
fi

# Ensure the directory exists
mkdir -p android/app

# Decode base64 and create the file
echo "$GOOGLE_SERVICES_JSON" | base64 -d > android/app/google-services.json

# Verify the file was created
if [ -f "android/app/google-services.json" ]; then
  FILE_SIZE=$(wc -c < android/app/google-services.json)
  echo "✅ google-services.json created successfully at android/app/"
  echo "   File size: $FILE_SIZE bytes"
  echo "   First 100 chars:"
  head -c 100 android/app/google-services.json
  echo ""
else
  echo "❌ Failed to create google-services.json at android/app/google-services.json"
  exit 1
fi
