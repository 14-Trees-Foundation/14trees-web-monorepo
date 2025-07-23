#!/bin/bash

# Build script for 14Trees API with memory optimization
# Usage: ./build.sh [mode]
# Modes: normal, fast, memory

set -e

MODE=${1:-normal}

echo "🚀 Starting build process..."
echo "📊 System memory info:"
free -h || echo "Memory info not available"

echo "🧹 Cleaning previous build..."
npm run clean

echo "🔧 Node.js version: $(node -v)"
echo "📦 NPM version: $(npm -v)"

case $MODE in
  "fast")
    echo "⚡ Running fast build..."
    npm run build:fast
    ;;
  "memory")
    echo "🧠 Running memory-optimized build..."
    npm run build:memory
    ;;
  *)
    echo "🏗️  Running normal build..."
    npm run build
    ;;
esac

echo "✅ Build completed successfully!"
echo "📁 Output directory: ./dist"
ls -la ./dist/ | head -10