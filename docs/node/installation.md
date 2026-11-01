---
title: Installation
description: Install wgkeeper node on a Linux server with the install script or Docker Compose, and keep it updated.
---

# Node installation

wgkeeper node runs one WireGuard® interface on a Linux host and exposes a REST API to manage its peers.

## Requirements

| | Requirement |
| --- | --- |
| Host | Linux on `amd64` or `arm64` with WireGuard kernel support (built in since kernel 5.6); root or `CAP_NET_ADMIN` |
| Docker | Capability `NET_ADMIN`. On kernels older than 5.6, load the module on the host with `modprobe wireguard` |
| Network | `51820/udp` open for WireGuard clients. With `--domain`, also `80/tcp` and `443/tcp` for the certificate and the API |

## Install with the script

Run this on the server:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-node/main/scripts/install.sh | sudo bash
```

For wgkeeper console on another machine, point a domain at the server and pass `--domain`. The script adds Caddy with a Let's Encrypt certificate in front of the API:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-node/main/scripts/install.sh | sudo bash -s -- --domain node1.example.com
```

:::tip[Read the script first]

The script runs as root. To review it first, download it, read it, then run the local copy:

```bash
curl -fsSL -o install.sh https://raw.githubusercontent.com/wgkeeper/wgkeeper-node/main/scripts/install.sh
less install.sh
sudo bash install.sh --domain node1.example.com
```

:::

### Options

Pass options after `bash -s --` when piping, or directly after `install.sh` when running a local copy.

| Option | Default | Description |
| --- | --- | --- |
| `--version X.Y.Z` | latest stable release | Release to install, 2.0.0 or newer. A leading `v` is accepted |
| `--domain NAME` | none | Add Caddy with a Let's Encrypt certificate for this domain (letters, digits, `.`, `-`). Ports 80 and 443 must be reachable |
| `--subnet CIDR` | `10.0.0.0/24` | IPv4 subnet for peers. Used only when `config.yaml` doesn't exist yet |
| `--dir PATH` | `/opt/wgkeeper` | Install directory |
| `-h`, `--help` | | Print the options and exit |

For tests, `WGKEEPER_IMAGE` replaces the image and `WGKEEPER_FILES` copies the files from a local checkout.

### What the script does

1. Checks for Linux, root, `curl` and WireGuard kernel support (`modprobe wireguard` or `/sys/module/wireguard`).
2. Installs Docker with `get.docker.com` if it's missing. Stops if Docker Compose v2 is missing.
3. Writes the [files](#where-the-files-are) for the latest stable release, or `--version`, with the image pinned to it (`ghcr.io/wgkeeper/node:X.Y.Z`).
4. Writes `config.yaml` only if none exists: a random API key (64 hex characters) and the subnet, readable by root only.
5. If ufw is active, opens `51820/udp`, plus `80/tcp` and `443/tcp` with Caddy. Other firewalls, such as cloud security groups, are up to you.
6. Runs `docker compose up -d --remove-orphans` and waits up to 60 seconds for `http://127.0.0.1:51821/readyz`.

### What it prints

You need the API address and key to add the node to wgkeeper console:

```text
wgkeeper node 2.0.0 is running in /opt/wgkeeper.

  API address:  https://node1.example.com
  API key:      <64 hex characters>
  WireGuard:    51820/udp

Add the node to your orchestrator or wgkeeper console with this address and key.
Manage it with: cd /opt/wgkeeper && docker compose ps | logs | down
```

Without `--domain`, the address line reads `http://127.0.0.1:51821 (this host only; use --domain for remote access)`. The key is also `auth.api_key` in `config.yaml`.

If the node doesn't become ready, the script stops with an error. Read the logs:

```bash
cd /opt/wgkeeper && docker compose logs wireguard
```

### Where the files are

| Path in `/opt/wgkeeper` | Contents | Replaced on update |
| --- | --- | --- |
| `config.yaml` | Node config with the API key | Never |
| `wireguard/` | Generated WireGuard config with the server private key | Never |
| `data/` | Peer store (`peers.db`) | Never |
| `docker-compose.yml` | Compose file of the installed release | Yes |
| `examples/caddy/compose.yml` | Caddy service, with `--domain` | Yes |
| `examples/caddy/Caddyfile` | Caddy site with your domain, with `--domain` | Never, once it exists |
| `docker-compose.override.yml` | Your own Compose changes, if you create it | Never |
| `.env` | `COMPOSE_FILE`, so plain `docker compose` commands here include Caddy and your override file when they exist | Yes |

### Allow only the console

Scanners find a new HTTPS domain within minutes of its certificate being issued. To accept requests from the console's address only, follow [Allow only the console](/docs/guides/reverse-proxy#allow-only-the-console). With the script, the Caddyfile is `/opt/wgkeeper/examples/caddy/Caddyfile`.

## Update the node

Run the script again. It installs the latest stable release, or the one you pass with `--version`:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-node/main/scripts/install.sh | sudo bash -s -- --version 2.0.1
```

It keeps the config, the server key and the peers, replaces `docker-compose.yml` and restarts the node on the new image. An existing Caddy layer stays, so you don't need `--domain` again.

:::warning

Read the [changelog](https://github.com/wgkeeper/wgkeeper-node/blob/main/CHANGELOG.md) before updating to a new major version. Coming from 1.x, see [Upgrading to 2.0](/docs/upgrading).

:::

## Install with Docker Compose

Use this to manage the files yourself. [`docker-compose.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docker-compose.yml) runs `ghcr.io/wgkeeper/node` and:

- grants `NET_ADMIN` only, with `no-new-privileges`;
- mounts `config.yaml`, `./wireguard` and `./data` (the peer store);
- publishes `51820/udp` on all interfaces and the API on `127.0.0.1:51821` only;
- enables IPv4 and IPv6 forwarding, checks `/readyz` and rotates logs (three files of 10 MB).

```bash
git clone https://github.com/wgkeeper/wgkeeper-node.git
cd wgkeeper-node
cp config.example.yaml config.yaml
openssl rand -hex 32   # paste into auth.api_key in config.yaml
docker compose up -d
```

The image in the file has no tag, so Docker pulls `latest`, the newest stable release. Pin a release such as `ghcr.io/wgkeeper/node:2.0.0` in `docker-compose.override.yml`, or use `edge` for the latest build from `main`.

:::danger[Keep the peer store volume]

The `./data` volume holds every peer. Without it, all peers are lost when the container is recreated.

:::

The API is reachable from this host only. Every `config.yaml` key is in [Configuration](/docs/node/configuration).

## Behind a reverse proxy

See [Reverse proxy and HTTPS](/docs/guides/reverse-proxy) for Caddy and nginx in front of the node and the console.

## From source

You need Go 1.27 or newer, plus `wireguard-tools`, `iproute2` and `iptables`. The binary writes the WireGuard config but doesn't bring the interface up. Do what the Docker entrypoint does:

```bash
go build -o wgkeeper-node ./cmd/server
# as root, next to config.yaml:
conf=$(./wgkeeper-node init --print-path)   # write the WireGuard config, print its path
wg-quick up "$conf"
./wgkeeper-node                              # start the API
```

See [Deployment](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/deployment.md#from-source) in the node repository.

## Next steps

- [Configuration](/docs/node/configuration): subnets, IPv6, the WAN interface and private networks.
- [Add the node to wgkeeper console](/docs/console/using-the-console#add-a-node).
- [Security](/docs/node/security): what the node blocks and what belongs in the proxy.
