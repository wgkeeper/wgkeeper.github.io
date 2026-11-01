---
title: Configuration
description: Every key in the wgkeeper node config.yaml, its default, and the environment variables the node reads.
---

# Node configuration

wgkeeper node reads its settings from `config.yaml` once, at startup. The annotated example is [`config.example.yaml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/config.example.yaml).

## Smallest config

Everything except the API key and a subnet has a default:

```yaml
auth:
  api_key: "<at least 32 characters>"
wireguard:
  subnet: "10.0.0.0/24"
```

Generate the API key with:

```bash
openssl rand -hex 32
```

The [install script](/docs/node/installation#install-with-the-script) writes this file with a random key and the subnet from `--subnet`.

:::warning[Unknown keys stop the node]

A misspelled or unknown key is an error that names the key, so no setting is silently ignored. Keys removed in 2.0.0 also stop the node: `server.tls_cert`, `server.tls_key`, `server.allowed_ips`, `server.trusted_proxies`, `metrics.per_peer` and `metrics.per_peer_max`. See [Upgrading to 2.0](/docs/upgrading#breaking-changes).

:::

## API

| Key | Default | Description |
| --- | --- | --- |
| `auth.api_key` | required | API key for all protected endpoints, at least 32 characters. Leading and trailing spaces are trimmed |
| `server.port` | `51821` | API port, `1` to `65535`. The API is plain HTTP on all interfaces |

With the install script, keep `server.port` at `51821`. The script's Compose file, health check and readiness check all use that port. In your own Compose file, change the published port and the health check together with it.

The node has no settings for TLS, IP allowlists or rate limits. They belong in the [reverse proxy](/docs/guides/reverse-proxy).

## WireGuard

At least one of `wireguard.subnet` and `wireguard.subnet6` is required. Set both for dual-stack.

| Key | Default | Description |
| --- | --- | --- |
| `wireguard.interface` | `wg0` | Interface name. Up to 15 letters, digits, `-`, `_` and `.` |
| `wireguard.listen_port` | `51820` | WireGuard UDP port, `1` to `65535` |
| `wireguard.subnet` | none | IPv4 CIDR for peer addresses, prefix up to `/30` |
| `wireguard.server_ip` | first host of `subnet` | IPv4 address of the server. Must be inside `subnet` |
| `wireguard.subnet6` | none | IPv6 CIDR for peer addresses, prefix up to `/126` |
| `wireguard.server_ip6` | first host of `subnet6` | IPv6 address of the server. Must be inside `subnet6` |
| `wireguard.routing.wan_interface` | interface of the default route | Outbound interface for the NAT rules, for example `eth0`. Letters, digits, `-`, `_` and `.` only |
| `wireguard.routing.allow_private_networks` | `false` | Let peers reach private and shared address space through the node. See [Peer isolation](/docs/node/security#peer-isolation) |
| `wireguard.peer_store_file` | `/var/lib/wgkeeper/peers.db` | Path of the [peer store](#peer-store). Must not be a directory |

Notes on these keys:

- Peers get addresses from the subnet minus its network and broadcast addresses and the server address. There is no scan limit, so every free address in a large subnet is used.
- If `listen_port` changes, publish the new UDP port in Compose too. With the install script, put the port in `docker-compose.override.yml`.
- When `wan_interface` is unset, the node uses the IPv4 default route with the lowest metric, then the IPv6 one. It refuses to start if neither exists. Set the key for policy routing or when the default route isn't the way out.

### Dual-stack example

```yaml
auth:
  api_key: "<at least 32 characters>"
wireguard:
  subnet: "10.0.0.0/24"
  subnet6: "fd00::/112"
```

### Let peers reach a private network

By default peers reach the internet only. To let them reach an office LAN or another private network through the node, set:

```yaml
wireguard:
  subnet: "10.0.0.0/24"
  routing:
    allow_private_networks: true
```

Cloud metadata addresses stay blocked. For the exact ranges, see [Peer isolation](/docs/node/security#peer-isolation).

## Metrics

Metrics are off while `metrics.port` is unset or `0`. See [Metrics](/docs/node/metrics).

| Key | Default | Description |
| --- | --- | --- |
| `metrics.port` | `0` (off) | Port of the `/metrics` endpoint, `1` to `65535` to turn it on |
| `metrics.token` | required with `metrics.port` | Bearer token for `/metrics`, at least 32 characters and different from `auth.api_key`. Ignored while metrics are off |

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_CONFIG` | `config.yaml` in the working directory | Path of the config file. The Docker image reads `/app/config.yaml` |
| `DEBUG` | off | `true` or `1` turns on debug-level logs. API responses don't change: internal error details only go to the log, next to the request's `X-Request-Id` |

## What happens on start

1. The node reads and validates `config.yaml`. Any error stops it with a message naming the key.
2. It writes the WireGuard config from `config.yaml`: addresses, listen port, NAT and isolation rules. The file is `/etc/wireguard/<interface>.conf`, or `./wireguard/<interface>.conf` when not running as root.
3. In the Docker image, the entrypoint brings the interface up with `wg-quick`.
4. The node opens the [peer store](#peer-store), checks it against the subnets, syncs the interface to it and removes expired peers.
5. The API starts. Expired peers are then removed every minute.

The server private key is generated on the first start and kept in the WireGuard config, so the server's public key never changes. If that file exists without a valid `PrivateKey`, the node refuses to start rather than generate a new key.

Don't edit the WireGuard config by hand; the node overwrites it. Change `config.yaml` and restart:

```bash
cd /opt/wgkeeper && docker compose restart
```

## Peer store

Peers are always stored in a bbolt file, `/var/lib/wgkeeper/peers.db` unless `wireguard.peer_store_file` says otherwise. The Compose file mounts `./data` there; keep that volume, or all peers are lost when the container is recreated.

The store is the source of truth:

- On startup the node adds stored peers missing on the interface and removes interface peers not in the store. Anything not created through the API, such as a manual `wg set`, is gone after a restart.
- Every create, rotate, delete and expiry is written to the store before the interface changes. If the interface change fails, the store write is rolled back.
- If the interface doesn't respond in time, the store write is kept and the node syncs the interface to it in the background.

The node refuses to start, and deletes nothing, if a stored peer falls outside the configured subnets, holds the server address or shares an address with another peer. A subnet typo therefore can't wipe your peers. To change subnets on purpose, first delete the peers outside the new subnets through the API.

The file is created with mode `0600`. It holds each peer's public key, preshared key, addresses and expiry, never the peer's private key. Details: [Peer store](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/peer-store.md).
