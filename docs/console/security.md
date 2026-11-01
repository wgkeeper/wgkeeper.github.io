---
title: Security
description: What wgkeeper console protects - passwords, sessions, node API keys, requests to nodes - and how to run it safely.
---

# Console security

wgkeeper console holds the API key of every node it manages and can create, rotate and delete peers on all of them. Treat access to it like access to the VPN itself.

Report vulnerabilities as described in [SECURITY.md](https://github.com/wgkeeper/wgkeeper-console/blob/main/SECURITY.md), not in a public issue.

## Running it safely

- **Use HTTPS** for anything but a loopback or SSH-tunnel connection, and set `COOKIE_SECURE=true`. The install script's `--domain` option does both; see [Reverse proxy](/docs/guides/reverse-proxy) for other setups.
- **Keep it private** behind a VPN or an [IP allowlist](/docs/console/installation#allow-only-your-addresses) in the proxy.
- **Keep its port on `127.0.0.1:8000`**, as the Compose file publishes it. Never publish it on all interfaces.
- **Set `TRUSTED_PROXIES`** behind a proxy, so the login rate limit counts real clients. See [Behind a reverse proxy](/docs/console/configuration#behind-a-reverse-proxy).
- **Back up `SECRET_KEY`** with the database. A new key can't decrypt the stored node API keys. See [Database and backups](/docs/console/database-and-backups).
- **Reach nodes over HTTPS or a private network.** Over plain HTTP on an untrusted network, the node API key and peer private keys travel in the clear.
- **Lock down the nodes.** Clients must reach each node's WireGuard port (`51820/udp` by default), and only the console should reach each node's API. See [Allow only the console](/docs/node/installation#allow-only-the-console).
- **Keep the metrics port private** if you turn metrics on. See [Keep the metrics port private](/docs/console/metrics-and-logs#keep-the-metrics-port-private).

## What is stored

| Data | Where | Protection |
| --- | --- | --- |
| User passwords | Database | bcrypt hashes |
| Node API keys | Database | AES-256-GCM, with a key derived from `SECRET_KEY`. Never returned by the API |
| Node addresses, status, version | Database | Not encrypted |
| Sessions | Not stored; a signed token in the browser's cookie | HMAC-SHA256 with a key derived from `SECRET_KEY` |
| Peer private keys | Never stored | Returned once, in the generated config |
| `SECRET_KEY` | `console.env` | File readable by root only, when written by the install script |

Node API keys stored without encryption, for example by a development install without `SECRET_KEY`, are encrypted when the console next starts with `SECRET_KEY` set.

## What the console does

| Mechanism | Details |
| --- | --- |
| First sign-in | The first user must change the bootstrap password. Until then, the API refuses everything except the password change. A new password needs at least 8 characters and can't be `admin` |
| Sign-in timing | A sign-in for an unknown user takes as long as one with a wrong password |
| Sessions | Token in the `wg_session` cookie (`HttpOnly`, path `/api`), valid for `SESSION_TTL` and refreshed while in use, never beyond 7 days after sign-in (or `SESSION_TTL`, if longer). Signing out or changing the password ends every session of the user, including copies of the cookie |
| Cookies | `Secure` in production, `SameSite=Lax` by default. The console refuses to start with `SameSite=None` without `Secure` |
| Cross-site requests | State-changing requests are refused when the browser says they come from another site (`Sec-Fetch-Site`, or `Origin` against `Host`). Request bodies must be JSON |
| Login rate limit | 10 failed sign-ins per client in 15 minutes, then a 15-minute block with `429`. A successful sign-in resets the count. IPv6 clients are counted per /64 |
| API rate limit | 120 requests per minute per client on routes that need sign-in, then `429` with `Retry-After` |
| Request limits | Bodies up to 1 MB, headers up to 8 KB |
| Node addresses | `http://` or `https://` only, without credentials in the URL |
| Requests to nodes | Redirects are never followed, responses are size-limited. The console never connects to link-local addresses (`169.254.0.0/16`, `fe80::/10`), the metadata addresses `fd00:ec2::254` and `100.100.100.200`, multicast or unspecified addresses, checked after DNS resolution. Loopback and private networks are allowed |
| Secrets in responses | Every API response has `Cache-Control: no-store` |
| Error details | Console errors are logged with the request ID; the client gets only an error code |
| Security headers | Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, and HSTS in production |
| Files on disk | The SQLite directory is created with mode `0750` |
| Container | Runs as a non-root user with `no-new-privileges`; the Compose file publishes the port on loopback only |

Rate limit counters are kept in memory and reset when the console restarts.

## If the console is lost or compromised

The VPN keeps working without the console, because peers live on the nodes. To recover without a backup, install a fresh console and add the nodes again with their API keys.

If the console or its database may have leaked, treat every node API key as exposed:

1. On each node, generate a new `auth.api_key` and restart the node.
2. In the console, remove the node and add it again with the new key. Removing a node from the console doesn't touch its peers.
