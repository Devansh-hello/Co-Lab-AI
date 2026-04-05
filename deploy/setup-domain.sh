#!/bin/bash
set -euo pipefail

# Usage: ./setup-domain.sh yourdomain.com

DOMAIN="${1:?Usage: ./setup-domain.sh yourdomain.com}"
INSTANCE_IP="54.82.24.94"
KEY_PATH="$HOME/.ssh/colab-ai-key.pem"

echo "=== Setting up custom domain: $DOMAIN ==="
echo ""
echo "Step 1: Point your domain's DNS to the EC2 instance"
echo "  Add an A record:  $DOMAIN → $INSTANCE_IP"
echo "  Add an A record:  www.$DOMAIN → $INSTANCE_IP"
echo ""
read -p "Press Enter after you've updated DNS..."

echo "Configuring nginx and SSL on server..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no "ubuntu@$INSTANCE_IP" << REMOTE
# Update nginx server_name
sudo sed -i "s/server_name _;/server_name $DOMAIN www.$DOMAIN;/" /etc/nginx/sites-available/colab-ai
sudo nginx -t && sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --redirect --email \$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "admin")@$DOMAIN
REMOTE

echo ""
echo "=== Done! ==="
echo "Your app is live at: https://$DOMAIN"
