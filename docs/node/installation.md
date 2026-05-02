---
sidebar_position: 3
title: Installation
---

# Node Installation

WGKeeper Node is installed with Docker Compose.

There are two modes:

- **Simple Docker Compose** — the easiest path; recommended for trying the node out
- **Docker Compose with Caddy** — recommended for production (HTTPS, reverse proxy)

If unsure, start with Simple. You can switch to the Caddy variant later without re-installing.

## Configuration example

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

Save it as `config.yaml`.

If you are not sure what to change, see [Node Configuration](/docs/node/configuration).

## File layout

In the simplest case, keep these files in one directory:

- `config.yaml`
- `docker-compose.yml` or another Compose file
- optional `Caddyfile`
- optional `./certs`
- optional `./peers`


## Simple Docker Compose

Use this for a simple and standard setup.

```yaml
services:
  wireguard:
    image: ghcr.io/wgkeeper/node
    restart: always
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    volumes:
      - ./config.yaml:/app/config.yaml:ro
      - ./wireguard:/etc/wireguard
      - ./certs:/app/certs:ro
      # Optional: persist peer store (set wireguard.peer_store_file: "/app/peers/peers.db" in config)
      # - ./peers:/app/peers
    ports:
      - "51820:51820/udp"
      - "51821:51821"
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
      - net.ipv4.ip_forward=1
      # Optional: enable these only if you want IPv6 support.
      # - net.ipv6.conf.all.disable_ipv6=0
      # - net.ipv6.conf.all.forwarding=1
      # - net.ipv6.conf.default.forwarding=1
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:51821/healthz"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 15s

networks:
  default:
    # Optional: enable IPv6 only if you need it.
    # enable_ipv6: true
    # ipam:
    #   config:
    #     - subnet: 172.18.0.0/16
    #     - subnet: fd00:dead:beef::/64
```

Start:

```bash
docker compose -f docker-compose.local.yml up -d
```

- exposes `51820/udp` for WireGuard® traffic
- exposes `51821` for the node API
- by default, peers are stored only in memory unless `wireguard.peer_store_file` is configured
- if you expose the node API directly, HTTPS on the node API is recommended
- IPv4 is the default setup; enable IPv6 only if you need it

## Docker Compose with Caddy

Use this if you want a more advanced setup with a reverse proxy in front of the node API.

```yaml
services:
  wireguard:
    image: ghcr.io/wgkeeper/node
    restart: always
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    volumes:
      - ./config.yaml:/app/config.yaml:ro
      - ./wireguard:/etc/wireguard
      - ./certs:/app/certs:ro
      # Optional: persist peer store (set wireguard.peer_store_file: "/app/peers/peers.db" in config)
      # - ./peers:/app/peers
    # In production we expose only the WireGuard UDP port on the host.
    # The REST API port (51821) stays internal to the Docker network and is
    # only reachable via the Caddy reverse proxy.
    ports:
      - "51820:51820/udp"
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
      - net.ipv4.ip_forward=1
      # Optional: keep these only if you want IPv6 support.
      # - net.ipv6.conf.all.disable_ipv6=0
      # - net.ipv6.conf.all.forwarding=1
      # - net.ipv6.conf.default.forwarding=1
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:51821/healthz"]
      interval: 10s
      timeout: 3s
      retries: 3
      start_period: 10s

  caddy:
    # Production reverse proxy: the only public HTTP(S) entrypoint.
    # Combine with server.allowed_ips and auth.api_key in config.yaml,
    # and restrict 80/443 on the host via firewall / security group.
    image: caddy:2
    restart: unless-stopped
    depends_on:
      wireguard:
        condition: service_healthy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:

networks:
  default:
    # Optional: keep this only if you want IPv6 support.
    # enable_ipv6: true
    # ipam:
    #   config:
    #     - subnet: 172.18.0.0/16
    #     - subnet: fd00:dead:beef::/64
```

Example `Caddyfile`:

```caddyfile
api.example.com {
  encode gzip zstd
  reverse_proxy wireguard:51821
}
```

Start:

```bash
docker compose -f docker-compose.prod-secure.yml up -d
```

- exposes `51820/udp` for WireGuard® traffic
- keeps the node API inside Docker
- uses Caddy as the public HTTP/HTTPS entrypoint
- by default, peers are stored only in memory unless `wireguard.peer_store_file` is configured
- when using Caddy, handle HTTPS in Caddy and do not set `server.tls_cert` / `server.tls_key` in the node config
- IPv4 is the default setup; enable IPv6 only if you need it

## Recommendation

The Caddy-based setup is the recommended option for production.

## Optional: monitoring

The node can expose a Prometheus `/metrics` endpoint. It is **off by default** and toggled in `config.yaml`.

If you want to add it later, see [Metrics](./metrics.md). Keep the metrics port inside the Docker network — do not publish it on the host.
