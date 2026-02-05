#!/bin/bash

# Load configuration
if [ -f .env.deploy ]; then
  export $(grep -v '^#' .env.deploy | xargs)
fi

if [ -z "$SERVER_IP" ]; then
  echo "❌ Error: SERVER_IP not found in .env.deploy"
  exit 1
fi

echo "🔓 Opening Port 3000 on $SERVER_IP..."

# Try ufw (Ubuntu/Debian standard)
ssh "$SERVER_USER@$SERVER_IP" "
  if command -v ufw > /dev/null; then
    echo 'Using UFW...'
    sudo ufw allow 3000/tcp
    sudo ufw reload
    sudo ufw status | grep 3000
  else
    echo '⚠️  UFW not found. Trying iptables...'
    sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
  fi
"

echo "✅ Port 3000 should now be open!"
echo "👉 Try accessing: http://$SERVER_IP:3000"
