---
title: Configuration
description: The environment variables wgkeeper console reads from console.env, their defaults, and the settings it needs behind a reverse proxy.
---

# Console configuration

wgkeeper console reads its settings from environment variables, kept in `console.env` next to `docker-compose.yml`. The install script writes `console.env` for you. For a manual setup, start from [`console.env.example`](https://github.com/wgkeeper/wgkeeper-console/blob/main/console.env.example).

After editing `console.env`, recreate the container:

```bash
cd /opt/wgkeeper-console && docker compose up -d
```

:::warning[Invalid values stop the console]

The console checks the variables at startup and exits with an error that names each bad variable. It never falls back to a default: `SESSION_TTL=7d` is an error, not 24 hours. Read the reason with `docker compose logs console`.

:::

## Required

| Variable | Description |
| --- | --- |
| `SECRET_KEY` | 64 hex characters (`openssl rand -hex 32`). The console derives two keys from it: one signs session tokens, one encrypts stored node API keys. Required when `APP_ENV` is `production`. Keep it stable and back it up: if it changes, every session ends and the stored node API keys can't be decrypted |
| `BOOTSTRAP_ADMIN_PASSWORD` | Password of the first user. Required while the database has no users; without it the console doesn't start. That user must change the password at the first sign-in. Ignored once a user exists |

## Server

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `8000` | HTTP port. If you change it, change the Compose port mapping, health check and proxy target too. The install script always checks port 8000 |
| `APP_ENV` | `production` | `production` serves the built UI and requires `SECRET_KEY`. Any other value is development mode. If `APP_ENV` is unset, `NODE_ENV` is used |
| `TRUSTED_PROXIES` | empty | Comma-separated proxy IPs or CIDRs whose `X-Forwarded-For` is trusted. An invalid entry stops the console. See [Behind a reverse proxy](#behind-a-reverse-proxy) |
| `HTTP_READ_TIMEOUT` | `10s` | Time to read a whole request |
| `HTTP_READ_HEADER_TIMEOUT` | `5s` | Time to read request headers |
| `HTTP_WRITE_TIMEOUT` | `30s` | Time to write a response. Keep it above 20s: a status refresh of many nodes can take that long |
| `HTTP_IDLE_TIMEOUT` | `60s` | How long an idle keep-alive connection stays open |
| `HTTP_SHUTDOWN_TIMEOUT` | `10s` | How long in-flight requests get to finish on shutdown |
| `CORS_ALLOW_ORIGINS` | none in production | Comma-separated origins allowed to call the API from another site. When set, requests with an `Origin` header not in the list are refused, so include the console's own origin. Not needed when the console serves its own UI |
| `DOCS` | `false` | Serve the Swagger UI at `/docs/index.html`, without sign-in |

Development mode (`APP_ENV` other than `production`) changes these defaults:

| Setting | In development mode |
| --- | --- |
| `SECRET_KEY` | May be unset. The console then uses a temporary key, sessions end on restart and node API keys are stored unencrypted |
| `COOKIE_SECURE` | `false` |
| `CORS_ALLOW_ORIGINS` | The Vite dev server: `http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:4173`, `http://127.0.0.1:4173` |
| UI | Not served; use the Vite dev server |
| HSTS header | Not sent |

## Sessions and cookies

| Variable | Default | Description |
| --- | --- | --- |
| `SESSION_TTL` | `24h` | Session length, as a Go duration (`30m`, `24h`). A session is refreshed while in use, up to 7 days after sign-in, or `SESSION_TTL` if that is longer. Must be greater than zero |
| `COOKIE_SECURE` | `true` in production | Send the session cookie over HTTPS only. Set `false` only for plain-HTTP access (the loopback port or an SSH tunnel) |
| `COOKIE_SAMESITE` | `lax` | `lax`, `strict` or `none`. `none` requires `COOKIE_SECURE=true` |
| `COOKIE_DOMAIN` | empty | Cookie domain, a hostname such as `console.example.com`. A URL is an error |
| `BOOTSTRAP_ADMIN_USERNAME` | `admin` | Name of the first user, created together with `BOOTSTRAP_ADMIN_PASSWORD` |

## Database

| Variable | Default | Description |
| --- | --- | --- |
| `DATABASE_URL` | `file:./wgkeeper-console.db` | `file:<path>` for SQLite, or `postgres://` / `postgresql://` URL for PostgreSQL. The image sets `file:/app/data/wgkeeper-console.db` |
| `DB_MAX_OPEN_CONNS` | `20` | PostgreSQL only; SQLite always uses one connection |
| `DB_MAX_IDLE_CONNS` | `10` | PostgreSQL only |
| `DB_CONN_MAX_LIFETIME` | `1h` | Close connections after this long |
| `DB_CONN_MAX_IDLE_TIME` | `15m` | Close connections idle this long |

To switch to PostgreSQL, see [Database and backups](/docs/console/database-and-backups#switch-to-postgresql).

## Logs and metrics

| Variable | Default | Description |
| --- | --- | --- |
| `LOG_FORMAT` | `text` | `text` or `json` (one JSON object per line) |
| `DEBUG` | `false` | Debug-level logs, including SQL queries with placeholders, never values |
| `METRICS_PORT` | unset (off) | Port of the Prometheus `/metrics` endpoint, 1 to 65535 and different from `PORT` |
| `METRICS_TOKEN` | none | Bearer token for `/metrics`, at least 32 characters. Required with `METRICS_PORT` |

See [Metrics and logs](/docs/console/metrics-and-logs).

## Outbound requests

The console sends requests to your nodes and to GitHub, to look up the latest wgkeeper node release.

| Variable | Default | Description |
| --- | --- | --- |
| `HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` | unset | Standard proxy variables for those requests. With a proxy, the console's [address checks](/docs/console/security#what-the-console-does) apply to the proxy, and the proxy decides where requests may go |
| `LATEST_NODE_RELEASE_OVERRIDE` | unset | For testing: a version, such as `2.1.0`, that the console treats as the latest wgkeeper node release instead of asking GitHub |

## Behind a reverse proxy

Set these on the console when it runs behind a proxy. For the proxy itself, see [Reverse proxy](/docs/guides/reverse-proxy).

| Variable | Value | Why |
| --- | --- | --- |
| `COOKIE_SECURE` | `true` | The browser reaches the console over HTTPS, so the session cookie must be HTTPS-only |
| `TRUSTED_PROXIES` | the proxy's address, see below | Without it, every request seems to come from the proxy. The login rate limit then sees one client, and ten wrong passwords from anyone lock everyone out |

| Proxy | `TRUSTED_PROXIES` |
| --- | --- |
| On the same host | `127.0.0.1,::1` |
| In a container on the same Docker network | `172.16.0.0/12,192.168.0.0/16,10.0.0.0/8` (what the repository examples and the install script's Caddy layer set), or your network's subnet |
| Load balancer with a known address | that address, for example `203.0.113.10` |
| No proxy | leave it unset |

Trust only addresses that clients can't reach directly; otherwise clients can set their own `X-Forwarded-For`.
