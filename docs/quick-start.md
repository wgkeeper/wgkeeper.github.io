---
sidebar_position: 2
title: Quick start
---

# Quick start

A minimal path to a working WGKeeper setup: one Console, one Node, and a working VPN client.

This page intentionally takes shortcuts (plain HTTP, default ports, single host). For production-grade installs follow the linked pages.

## Before you start

- Docker and Docker Compose installed on the machine that will run the Node (and on the Console host, if separate).
- The Node host has a public IPv4 and an open UDP port for WireGuard® (default `51820/udp`).

## 1. Run the Console

Create `docker-compose.yaml`:

```yaml
services:
  wgkeeper-console:
    image: ghcr.io/wgkeeper/console
    ports:
      - "8000:8000"
    environment:
      PORT: 8000
      DATABASE_URL: file:/app/data/wgkeeper-console.db
      SECRET_KEY: REPLACE_WITH_OUTPUT_OF_openssl_rand_hex_32
      BOOTSTRAP_ADMIN_PASSWORD: change-me-now
      COOKIE_SECURE: "false"
    volumes:
      - wgkeeper-console-data:/app/data
    restart: unless-stopped

volumes:
  wgkeeper-console-data:
```

Generate the secret and start:

```bash
openssl rand -hex 32     # paste into SECRET_KEY
docker compose up -d
```

Open `http://localhost:8000`, log in as `admin` with the bootstrap password, and set a new password when prompted.

For HTTPS and a reverse proxy, see [Console Installation](./console/installation.md).

## 2. Run a Node

On the Node host, create `config.yaml`:

```yaml
server:
  port: 51821
auth:
  api_key: "REPLACE_WITH_A_LONG_RANDOM_STRING"
wireguard:
  interface: "wg0"
  subnet: "10.0.0.0/24"
  server_ip: "10.0.0.1"
  listen_port: 51820
  routing:
    wan_interface: "eth0"
```

Use `ip route` to confirm `wan_interface` matches the host's outbound NIC.

Create `docker-compose.yaml`:

```yaml
services:
  wireguard:
    image: ghcr.io/wgkeeper/node
    restart: always
    cap_add: [NET_ADMIN, SYS_MODULE]
    volumes:
      - ./config.yaml:/app/config.yaml:ro
      - ./wireguard:/etc/wireguard
    ports:
      - "51820:51820/udp"
      - "51821:51821"
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
      - net.ipv4.ip_forward=1
```

Start:

```bash
docker compose up -d
```

For TLS, allowlists, peer persistence, and IPv6 see [Node Installation](./node/installation.md) and [Node Configuration](./node/configuration.md).

## 3. Connect the Node to the Console

In the Console, open **Nodes → Add node** and provide:

- **API endpoint** — `http://<node-host>:51821`
- **API key** — the value of `auth.api_key` from the Node `config.yaml`
- **Name** — anything that identifies the server clearly

The node should appear with status **online** within a few seconds. If it doesn't, check the API endpoint is reachable from the Console host and the API key matches.

## 4. Create a peer

In the Console, open the node and click **Create peer**. The Console allocates an IP, generates keys, and exposes a downloadable client config.

See [Managing peers and configs](./console/managing-peers-and-configs.md) for fields, expiry, and re-issue flow.

## 5. Connect a client

Import the downloaded `.conf` into a WireGuard client (mobile app, `wg-quick up <file>` on Linux/macOS, etc.).

Once connected, the peer's handshake counter in the Console starts updating.

## What to do next

- **Production hardening:** [Console Installation](./console/installation.md) (Caddy + HTTPS), [Node Installation](./node/installation.md) (Caddy variant).
- **Persistence:** set `wireguard.peer_store_file` so peers survive restarts — see [Node Configuration](./node/configuration.md#peer-persistence).
- **Access control:** `server.allowed_ips` on the Node — see [Node Configuration](./node/configuration.md#access-control).
- **Monitoring:** optional Prometheus/Grafana — see [Metrics](./node/metrics.md).
