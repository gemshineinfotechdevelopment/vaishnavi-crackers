#!/usr/bin/env bash
# ==============================================================================
# Vaishnavi Crackers VPS Deployment / Update Script
# Subdomain: vaishnavi-crackers-shop.gemshine.tech
# Backend Port: 5016
# Usage on VPS: bash deploy.sh
# ==============================================================================

set -e

echo "🚀 [1/5] Pulling latest changes from Git..."
git pull origin main

echo "📦 [2/5] Installing root & frontend dependencies..."
npm install

echo "📦 [3/5] Installing backend dependencies..."
npm --prefix server install

echo "🔨 [4/5] Building frontend & backend (TypeScript)..."
npm run build:all

echo "🔄 [5/5] Reloading PM2 backend service (Port 5016: vaishnavi-crackers-api)..."
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs

echo "=========================================================="
echo "✅ Vaishnavi Crackers deployed successfully on Port 5016!"
echo "🌐 URL: https://vaishnavi-crackers-shop.gemshine.tech"
echo "=========================================================="
