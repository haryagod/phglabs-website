#!/bin/sh
# Start or update the PHG Labs website on the ShopStock server. Run from this folder (~/phglabs/deploy).
# The site files must already be in ./site (deploy.sh or GitHub Actions copies them).
set -eu
cd "$(dirname "$0")"

docker network create edge >/dev/null 2>&1 || true

# Check the nginx config in a throwaway container first, so a mistake never takes the running site down
docker run --rm -v "$PWD/nginx.conf:/etc/nginx/conf.d/default.conf:ro" -v "$PWD/site:/usr/share/nginx/html:ro" \
  nginx:1.27-alpine nginx -t -q

docker compose up -d --remove-orphans

# nginx only reads its config at start-up: reload it, or recreate the container if it still sees an old copy of the file
if [ "$(docker compose exec -T phglabs-web md5sum /etc/nginx/conf.d/default.conf | cut -d' ' -f1)" = "$(md5sum nginx.conf | cut -d' ' -f1)" ]; then
  docker compose exec -T phglabs-web nginx -s reload
else
  docker compose up -d --force-recreate phglabs-web
fi

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
