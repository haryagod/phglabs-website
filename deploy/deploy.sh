#!/bin/sh
# Deploy the website from this computer to the ShopStock Oracle server.
#   sh deploy/deploy.sh
# Override the defaults with DEPLOY_HOST, DEPLOY_USER or DEPLOY_KEY if needed.
set -eu
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-137.23.53.141}"
USER="${DEPLOY_USER:-ubuntu}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/shopstock_deploy}"
SSH="ssh -i $KEY -o BatchMode=yes"

echo "Packing site..."
tar -czf /tmp/phglabs-site.tgz index.html robots.txt sitemap.xml assets css js branding
echo "Uploading to $USER@$HOST..."
$SSH "$USER@$HOST" 'mkdir -p ~/phglabs/deploy'
scp -i "$KEY" -o BatchMode=yes -q /tmp/phglabs-site.tgz deploy/docker-compose.yml deploy/nginx.conf deploy/phglabs.caddy deploy/update.sh "$USER@$HOST:phglabs/deploy/"
$SSH "$USER@$HOST" 'cd ~/phglabs/deploy && mkdir -p site && find site -mindepth 1 -delete && tar -xzf phglabs-site.tgz -C site && rm phglabs-site.tgz && sh update.sh'
rm -f /tmp/phglabs-site.tgz
echo "Done: https://phglabs.in"
