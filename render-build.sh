#!/usr/bin/env bash
# Render build script for Puppeteer/Chromium

set -e

echo "📦 Installing dependencies..."
yarn install

echo "🔧 Installing Chromium for Puppeteer..."
# Install Chromium and dependencies
apt-get update
apt-get install -y chromium chromium-sandbox

echo "📝 Checking Chromium installation..."
which chromium || which chromium-browser || echo "⚠️ Chromium not found in PATH"

echo "🏗️ Building TypeScript..."
yarn build

echo "✅ Build complete!"
