#!/bin/bash
set -euo pipefail

# --- Config ---
INSTANCE_IP="54.82.24.94"
KEY_PATH="$HOME/.ssh/colab-ai-key.pem"
SSH_USER="ubuntu"
APP_DIR="/home/deploy/app"

echo "=== Deploying Co-Lab AI to EC2 ==="

# Push latest to GitHub first
echo "Pushing to GitHub..."
git push origin main

# SSH into instance and run deploy
echo "Deploying on server..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "$SSH_USER@$INSTANCE_IP" << 'REMOTE'
sudo su - deploy -c "cd /home/deploy/app && git pull origin main && npm install && npm run build"
sudo su - deploy -c "cd /home/deploy/app && pm2 delete all 2>/dev/null || true"
sudo su - deploy -c "cd /home/deploy/app/apps/api && pm2 start dist/index.js --name colab-api --env production"
sudo su - deploy -c "cd /home/deploy/app/apps/web && pm2 start npm --name colab-web -- start"
sudo su - deploy -c "pm2 save"
REMOTE

echo ""
echo "=== Deploy complete! ==="
echo "App: http://$INSTANCE_IP"
echo "API: http://$INSTANCE_IP/api/v1"
