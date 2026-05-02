---
sidebar_position: 2
title: Installation
---

# Console Installation

WGKeeper Console is the central interface for managing WGKeeper Nodes and WireGuard® peers.

Use it to connect nodes, inspect peer state, download generated configs, and manage console access.

The recommended production setup is Docker Compose with Caddy in front of the console.

## Requirements

- Docker and Docker Compose
- a stable `SECRET_KEY`
- an initial admin password
- a domain name if you use the recommended Caddy setup

Generate `SECRET_KEY` once and keep it stable between restarts:

```bash
openssl rand -hex 32
```

## Recommended: Docker Compose with Caddy

Use this setup when exposing WGKeeper Console publicly. Caddy provides the public HTTP/HTTPS entrypoint and forwards traffic to the console container inside the Docker network.

Create `docker-compose.yaml`:

```yaml
services:
  wgkeeper-console:
    image: ghcr.io/wgkeeper/console:1.0.0
    container_name: wgkeeper-console
    environment:
      PORT: 8000
      DATABASE_URL: file:/app/data/wgkeeper-console.db
      SECRET_KEY: paste-generated-64-char-hex-key-here
      BOOTSTRAP_ADMIN_PASSWORD: change-me-now
      COOKIE_SECURE: "true"
      # Trust X-Forwarded-For from Caddy on the internal Docker network so
      # per-IP rate limits apply per real client, not to all users via the
      # proxy IP. Port 8000 is not published, so only the proxy can reach
      # the app.
      TRUSTED_PROXIES: "172.16.0.0/12,192.168.0.0/16,10.0.0.0/8,127.0.0.1"
    volumes:
      - wgkeeper-console-data:/app/data
    restart: unless-stopped

  caddy:
    image: caddy:2
    container_name: wgkeeper-console-caddy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    depends_on:
      - wgkeeper-console
    restart: unless-stopped

volumes:
  wgkeeper-console-data:
  caddy-data:
  caddy-config:
```

Create `Caddyfile` and replace `console.example.com` with your real domain:

```caddyfile
console.example.com {
  reverse_proxy wgkeeper-console:8000
}
```

Start the console:

```bash
docker compose up -d
```

Open `https://console.example.com`.

Default bootstrap login:

- username: `admin`
- password: value of `BOOTSTRAP_ADMIN_PASSWORD`

The first login requires a password change.

## Basic Docker Compose

Use this for a local setup or for testing over plain HTTP.

Create `docker-compose.yaml`:

```yaml
services:
  wgkeeper-console:
    image: ghcr.io/wgkeeper/console:1.0.0
    container_name: wgkeeper-console
    ports:
      - "8000:8000"
    environment:
      PORT: 8000
      DATABASE_URL: file:/app/data/wgkeeper-console.db
      SECRET_KEY: paste-generated-64-char-hex-key-here
      BOOTSTRAP_ADMIN_PASSWORD: change-me-now
      COOKIE_SECURE: "false"
    volumes:
      - wgkeeper-console-data:/app/data
    restart: unless-stopped

volumes:
  wgkeeper-console-data:
```

Start the console:

```bash
docker compose up -d
```

Open `http://localhost:8000`.

Use `COOKIE_SECURE=false` only when serving over plain HTTP. For HTTPS deployments, set `COOKIE_SECURE=true`.

## Configuration

Most deployments only need these variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | none | Required secret for sessions and stored API keys |
| `BOOTSTRAP_ADMIN_PASSWORD` | none | Initial admin password on first start |
| `DATABASE_URL` | `file:/app/data/wgkeeper-console.db` | SQLite file or PostgreSQL connection URL |
| `PORT` | `8000` | App port |
| `COOKIE_SECURE` | `true` in production | Set to `false` only when serving over plain HTTP |

Optional variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BOOTSTRAP_ADMIN_USERNAME` | `admin` | Initial admin username |
| `TRUSTED_PROXIES` | none | Comma-separated list of CIDRs/IPs whose `X-Forwarded-For` is trusted. Set this when running behind a reverse proxy so per-IP rate limits apply to the real client IP. |
| `DOCS` | `false` | Enables Swagger UI at `/docs/index.html` |
| `DEBUG` | `false` | Enables debug logging |

PostgreSQL is supported with `DATABASE_URL`:

```env
DATABASE_URL=postgres://user:password@postgres:5432/wgkeeper_console
```

## Next step

After logging in, add your WGKeeper Nodes in the console. Each node needs its API endpoint and API key from the node configuration.
