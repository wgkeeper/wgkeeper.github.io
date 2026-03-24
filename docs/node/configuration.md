---
sidebar_position: 4
title: Node Configuration
---

# Node Configuration

WGKeeper Node reads configuration from `config.yaml`.

Use this page to understand what to adjust.

## Example

```yaml
server:
  port: 51821
  # Optional: enable HTTPS (set both paths)
  # tls_cert: "/app/certs/fullchain.pem"
  # tls_key: "/app/certs/privkey.pem"
  # Optional: allow API access only from these IPv4/IPv6 addresses or CIDRs (omit or leave empty to allow all)
  # allowed_ips:
  #   - "10.0.0.0/24"
  #   - "fd00::1"
auth:
  api_key: "changeme"
wireguard:
  interface: "wg0"
  # At least one of subnet or subnet6 is required. You can set both for dual-stack.
  subnet: "10.0.0.0/24"
  server_ip: "10.0.0.1"
  # Optional: IPv6 (any prefix, e.g. /64, /112, /128; for /64 the first 65536 addresses are used)
  # subnet6: "fd00::/112"
  # server_ip6: "fd00::1"
  listen_port: 51820
  # Optional: persist peer store to a bbolt DB file (load on startup, save on every change).
  # For Docker: use "/app/peers/peers.db" and mount ./peers:/app/peers so the app creates the file.
  # peer_store_file: "/app/peers/peers.db"
  routing:
    wan_interface: "eth0"
```

## Main settings

`server.port`

- API port for the node service

`server.allowed_ips`

- Optional IP allowlist for protected API access
- If set, protected endpoints require both a valid API key and a whitelisted IP
- If not set, protected endpoints still require the API key and rate limiting is applied

`server.tls_cert` and `server.tls_key`

- Optional HTTPS certificate and key paths
- Set both together
- Recommended if you expose the node API directly without Caddy
- If you use Caddy, terminate HTTPS in Caddy instead and leave these unset

`auth.api_key`

- Required API key for protected endpoints

`wireguard.interface`

- WireGuard® interface name, for example `wg0`

`wireguard.listen_port`

- UDP port for WireGuard® traffic

`wireguard.subnet`

- IPv4 subnet used for peer allocation

`wireguard.subnet6`

- Optional IPv6 subnet
- IPv4 is the default setup; IPv6 is configured additionally when needed

`wireguard.routing.wan_interface`

- Outbound network interface used for routing and NAT

`wireguard.peer_store_file`

- Optional persistent peer store path
- Enables peer persistence on disk
- Without it, peers are stored only in memory and will be lost after a node restart

## What to adjust

- Use a strong `auth.api_key`
- Check `wireguard.routing.wan_interface`
- Use `server.allowed_ips` in production
- Use Caddy if the API is exposed publicly

## Access control

Protected endpoints always require `auth.api_key`.

`/healthz` and `/readyz` are public.

If `server.allowed_ips` is not configured:

- the API key is still required
- request throttling is active

If `server.allowed_ips` is configured:

- the API key is still required
- the client IP must also match the whitelist
- throttling is disabled

## HTTPS guidance

- Without Caddy, HTTPS on the node API is recommended
- With Caddy, configure HTTPS in Caddy and do not enable node TLS in `config.yaml`

## Peer persistence

By default, peers are stored only in memory on the node.

That means they are removed after a restart.

To persist peers, set `wireguard.peer_store_file`.

Docker example:

```yaml
wireguard:
  peer_store_file: "/app/peers/peers.db"
```

In Docker, mount a writable directory for it:

```yaml
volumes:
  - ./peers:/app/peers
```
