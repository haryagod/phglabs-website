# Deployment

The site runs on the ShopStock Oracle server (`ubuntu@137.23.53.141`) as its own small Compose project
(`phglabs-web`, nginx, about 5 MB of memory with a 32 MB cap). ShopStock's Caddy serves it at **https://phglabs.in**
and gets the HTTPS certificate on its own. `www.phglabs.in` redirects to `phglabs.in`. The same nginx container also
serves the free games site **https://play.phglabs.in** from `play/` (see `play/README.md`).

```
Internet ─443─▶ Caddy (shopstock-cloud) ─┬─ ShopStock
                                         ├─ phglabs.in ──────┐
                                         └─ play.phglabs.in ─┴▶ phglabs-web (network: edge)
```

## Publishing changes

Push to `main`. GitHub Actions (`.github/workflows/deploy.yml`) copies the site to `~/phglabs/deploy/site`
on the server and runs `update.sh`, which checks the nginx config in a throwaway container, reloads nginx and reloads Caddy. It uses the same secrets as ShopStock:
`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` and `DEPLOY_KNOWN_HOSTS`.

From this computer, without GitHub: `sh deploy/deploy.sh`

## DNS (GoDaddy)

| Type  | Name | Value           |
|-------|------|-----------------|
| A     | `@`  | `137.23.53.141` |
| CNAME | `www`| `phglabs.in`    |
| A     | `play` | `137.23.53.141` |

Product subdomains on the same server, such as `shopstock.phglabs.in`, are each one more A record to `137.23.53.141`
plus that name added to the app's Caddy site file.

## Server folders

* `~/phglabs/deploy`: compose file, nginx config, `update.sh`, and `site/` with the website files
* `~/shopstock/deploy/sites/phglabs.caddy`: the Caddy site file, copied there by `update.sh`
