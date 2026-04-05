#!/bin/bash
set -euo pipefail
exec > /var/log/user-data.log 2>&1

echo "=== Co-Lab AI EC2 Setup ==="

# --- Swap (1GB RAM is tight for builds) ---
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# --- System packages ---
apt-get update -y
apt-get install -y nginx certbot python3-certbot-nginx git

# --- Node.js 20 LTS ---
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# --- PM2 (process manager) ---
npm install -g pm2

# --- App user ---
useradd -m -s /bin/bash deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/ 2>/dev/null || true
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# --- Clone repo ---
su - deploy -c "git clone https://github.com/Devansh-hello/Co-Lab-AI.git /home/deploy/app"

# --- Nginx config ---
cat > /etc/nginx/sites-available/colab-ai << 'NGINX'
server {
    listen 80;
    server_name _;

    # Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes → Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket endpoint
    location /ws {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
}
NGINX

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/colab-ai /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# --- Deploy script ---
cat > /home/deploy/deploy.sh << 'DEPLOY'
#!/bin/bash
set -euo pipefail
cd /home/deploy/app

echo "=== Pulling latest code ==="
git pull origin main

echo "=== Installing dependencies ==="
npm install

echo "=== Building apps ==="
npm run build

echo "=== Restarting services ==="
pm2 delete all 2>/dev/null || true

# Start API backend
cd apps/api
pm2 start dist/index.js --name "colab-api" --env production
cd ../..

# Start Next.js frontend
cd apps/web
pm2 start npm --name "colab-web" -- start
cd ../..

pm2 save
echo "=== Deploy complete ==="
DEPLOY
chmod +x /home/deploy/deploy.sh
chown deploy:deploy /home/deploy/deploy.sh

# --- PM2 startup on boot ---
env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

echo "=== EC2 setup complete ==="
