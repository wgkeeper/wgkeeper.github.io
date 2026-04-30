---
sidebar_position: 5
title: Metrics
---

# Metrics

WGKeeper Node can expose a Prometheus `/metrics` endpoint.

It is **off by default**. Enable it when you want to monitor a node with Prometheus, Grafana, or any compatible TSDB. When enabled, it runs on its own HTTP listener with mandatory bearer auth, separate from the API key.

If you don't need monitoring, leave the section out — nothing else changes.

## Quick start

Three steps:

### 1. Enable in `config.yaml`

Add a `metrics` section. The same `config.yaml` is described in [Node Configuration](./configuration.md).

```yaml
metrics:
  port: 9090
  token: "REPLACE_WITH_32+_RANDOM_CHARS"
```

Generate a token:

```bash
openssl rand -hex 32
```

Use the same value for `metrics.token` and for the Prometheus scraper in step 2.

### 2. Scrape with Prometheus

Add a Prometheus service to the same Docker Compose as the node. The node repo ships ready templates:

- [`docker-compose.local.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docker-compose.local.yml) — has a commented-out `prometheus` block; uncomment it.
- [`docs/prometheus.example.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/prometheus.example.yml) — drop-in scrape config.

Save the same hex string into a token file:

```bash
openssl rand -hex 32 | tee ./wgkeeper-token
```

Start:

```bash
docker compose -f docker-compose.local.yml up -d
```

Prometheus reaches the node via Docker DNS (`http://wireguard:9090`). Nothing is published on the host.

### 3. (Optional) Import the Grafana dashboard

A pre-built dashboard is provided: [`docs/grafana-dashboard.json`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/grafana-dashboard.json).

1. Install Grafana and point it at the same Prometheus instance.
2. **Dashboards → New → Import** and upload `grafana-dashboard.json`.
3. Pick the Prometheus data source when prompted.

Grafana is optional. The node only exposes metrics — visualisation, alerts, and storage are your choice.

## Reference

### Configuration fields

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `metrics.port` | int | — | Required when the section is present |
| `metrics.token` | string | — | Required; at least 32 chars; **must differ** from `auth.api_key` |
| `metrics.per_peer` | bool | `false` | Expose per-peer series (rx/tx, last handshake) |
| `metrics.per_peer_max` | int | `100` | Cardinality cap when `per_peer: true` |

If `metrics.token` is missing, too short, or equal to `auth.api_key`, the node refuses to start.

The full annotated example lives in [`config.example.yaml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/config.example.yaml).

### What is exposed

| Metric | Type | Use |
|--------|------|-----|
| `wgkeeper_peers` | gauge | capacity / utilisation by state |
| `wgkeeper_peer_operations_total` | counter | error rate, throughput |
| `wgkeeper_peer_operation_duration_seconds` | histogram | p99 latency |
| `wgkeeper_persist_rollback_total` | counter | crash-safety rollbacks fired |
| `wgkeeper_persist_rollback_failed_total` | counter | page on this — bbolt holds a record device-write rolled back from |
| `wgkeeper_wireguard_rx_bytes_total` | counter | total received bytes across all peers |
| `wgkeeper_wireguard_tx_bytes_total` | counter | total transmitted bytes across all peers |
| `wgkeeper_wireguard_stale_peers` | gauge | peers with no handshake in the last 5 min |
| `wgkeeper_http_requests_total` | counter | API throughput, error rate, 401-burst detection |
| `wgkeeper_http_request_duration_seconds` | histogram | per-endpoint p99 latency |
| `process_*`, `go_*` | — | standard process and Go runtime |

The HTTP `path` label uses the route template (e.g. `/peers/:peerId`), never the raw URL — UUIDs would explode cardinality. Unmatched routes are bucketed under `path="unmatched"`.

### Per-peer metrics (advanced)

With `metrics.per_peer: true`:

| Metric | Type | Labels |
|--------|------|--------|
| `wgkeeper_peer_rx_bytes_total` | counter | `peer_id`, `allowed_ip` |
| `wgkeeper_peer_tx_bytes_total` | counter | `peer_id`, `allowed_ip` |
| `wgkeeper_peer_last_handshake_seconds` | gauge (age) | `peer_id`, `allowed_ip` |
| `wgkeeper_peers_capped` | gauge | — |

`metrics.per_peer_max` caps cardinality. The collector keeps the **top-N peers by current scrape-window traffic** — quieter peers fall out of metrics but remain visible via `GET /peers/:id`. `wgkeeper_peers_capped` reports how many peers were excluded.

Suggested values:

| Active peers | `per_peer_max` |
|--------------|----------------|
| < 500 | 500 |
| 500 – 2 000 | 200 |
| 2 000 – 10 000 | 100 *(default)* |
| 10 000+ | 50 |
| 50 000+ | keep `per_peer: false` |

## Security

### Do not publish the metrics port on the host

In Docker, **never** add `9090:9090` to the `wireguard` service `ports:`. Operational signal (peer counts, version, capacity) on the public internet without mTLS is a recon channel.

The provided compose files already follow this rule:

- [`docker-compose.local.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docker-compose.local.yml) — Prometheus runs alongside the node; nothing is published.
- [`docker-compose.prod-secure.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docker-compose.prod-secure.yml) — only WireGuard UDP is exposed; metrics stay internal.

### Production scraping

For production, keep `/metrics` on the internal network. For external scraping, either:

- run Prometheus in the same compose, or
- add a separate Caddy site (e.g. `metrics.example.com`) with **client cert auth (mTLS)** that proxies to `wireguard:9090`.

Do not expose `/metrics` over the public internet behind only the bearer token.
