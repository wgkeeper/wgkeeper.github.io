---
title: Security
description: What wgkeeper node protects by itself, how it isolates peers, and what you need to put in the reverse proxy in front of it.
---

# Node security

What wgkeeper node protects by itself, and what you must add in the reverse proxy. The full reference is [Security](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/security.md) in the node repository. Report vulnerabilities as described in [SECURITY.md](https://github.com/wgkeeper/wgkeeper-node/blob/main/SECURITY.md), not in a public issue.

## What the node does

| Mechanism | Details |
| --- | --- |
| API key | Required on every endpoint except `/healthz` and `/readyz` (`X-API-Key`), at least 32 characters, compared as SHA-256 digests in constant time |
| Error details | Logged with the request ID, never returned to the client |
| Peer isolation | Peers reach the internet only; see [below](#peer-isolation) |
| Container | `NET_ADMIN` only, `no-new-privileges` |
| Request limits | Bodies up to 256 KB (larger get `413`), read only after authentication. Headers up to 16 KB |
| Input validation | Peer IDs must be UUID v4; `offset` and `limit` are range-checked; unknown JSON fields are rejected |
| Config validation | Unknown keys stop the node. The interface name and `wireguard.routing.wan_interface`, set or detected, are limited to a safe character set because they go into iptables rules |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`. Peer creation responses add `Cache-Control: no-store` |
| Files on disk | WireGuard config and peer store are written with mode `0600`; peer private keys are never stored. The install script writes `config.yaml` readable by root only |
| Logs | Config errors never print the YAML around them, so the API key and metrics token don't reach the log |
| Release images | Signed build provenance and an SBOM; see [Verifying images](https://github.com/wgkeeper/wgkeeper-node/blob/main/SECURITY.md#verifying-images) |

## What belongs in the reverse proxy

The node has no TLS, IP filtering or rate limiting. The API listens on all interfaces; the Compose file publishes it on `127.0.0.1` only. Setup steps and examples are in [Reverse proxy and HTTPS](/docs/guides/reverse-proxy).

| Requirement | Why |
| --- | --- |
| TLS with HSTS | Without HTTPS, the API key and peer private keys cross the network in the clear |
| No public port | Reach the node over loopback or a private network; never publish `51821` on a public interface. On bare metal, firewall it |
| IP allowlist for wgkeeper console or your orchestrator | The simplest protection. See [Allow only the console](/docs/guides/reverse-proxy#allow-only-the-console) |
| `/metrics` off the public site | See [Metrics](/docs/node/metrics#keep-the-metrics-port-private) |

Client addresses are only logged, never used for access decisions. The node logs the TCP peer address, and `X-Forwarded-For` as `forwarded_for`.

## Peer isolation

The NAT rules in the generated WireGuard config let peers out to the internet through the WAN interface only. Peer traffic is dropped when it goes:

| Destination | Blocked |
| --- | --- |
| Another peer, or any interface other than the WAN one | Always |
| The node itself: the API, metrics and any other service on the host or container | Always, except ping (ICMP) |
| Cloud instance metadata: `169.254.0.0/16`, `100.100.100.200`, `fe80::/10`, `fd00:ec2::254` | Always |
| Private and shared address space: `10/8`, `172.16/12`, `192.168/16`, `100.64/10`, `fc00::/7`. This covers the host's LAN, the Docker networks and the cloud VPC | Unless `allow_private_networks` is on |

If peers need private networks, such as an office LAN, set:

```yaml
wireguard:
  routing:
    allow_private_networks: true
```

Peers still can't reach each other, the node itself or cloud metadata.

## Secrets

| Secret | Where | Notes |
| --- | --- | --- |
| API key | `auth.api_key` in `config.yaml` | Anyone with it can create, rotate and delete every peer on the node |
| Metrics token | `metrics.token` in `config.yaml` | Must differ from the API key. Grants access to `/metrics` only |
| Server private key | Generated WireGuard config under `./wireguard` | Back it up with the peer store. A new server key means every client needs a new config |
| Preshared keys | Peer store under `./data` | Back it up and keep it private like the server key |
