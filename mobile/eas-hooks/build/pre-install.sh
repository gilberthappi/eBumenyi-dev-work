#!/bin/bash

# EAS pre-install hook - runs before npm install
# Decode base64-encoded google-services.json from environment variable

if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "🔧 Decoding google-services.json from EAS environment..."
  
  # Decode base64 and create the file
  mkdir -p "android/app"
  echo "$GOOGLE_SERVICES_JSON" | base64 -d > "android/app/google-services.json"
  
  if [ -f "android/app/google-services.json" ]; then
    echo "✅ google-services.json created successfully at android/app/"
  else
    echo "❌ Failed to create google-services.json"
    exit 1
  fi
else
  echo "⚠️ GOOGLE_SERVICES_JSON environment variable not set - build will fail if google-services.json is required"
fi
