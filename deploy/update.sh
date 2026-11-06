#!/bin/sh
# Start or update the PHG Labs website on the ShopStock server. Run from this folder (~/phglabs/deploy).
# The site files must already be in ./site (deploy.sh or GitHub Actions copies them).
set -eu
cd "$(dirname "$0")"

docker network create edge >/dev/null 2>&1 || true
docker compose up -d --remove-orphans

# Hand the site file to ShopStock's Caddy and reload it (no restart, no downtime for ShopStock)
SITES="$HOME/shopstock/deploy/sites"
if [ -d "$SITES" ]; then
  cp phglabs.caddy "$SITES/phglabs.caddy"
  (cd "$HOME/shopstock/deploy" && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile)
else
  echo "WARNING: $SITES not found. ShopStock must be deployed with sites/ support first." >&2
  exit 1
fi

docker compose ps --format '{{.Service}}: {{.Status}}'
