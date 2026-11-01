---
title: Metrics
description: Enable the wgkeeper node Prometheus endpoint, scrape it from inside Docker, and use the bundled alerting rules and Grafana dashboard.
---

# Node metrics

wgkeeper node can serve Prometheus metrics at `/metrics` on a separate port. They are off until you add a `metrics` section to `config.yaml`. The full reference is [Metrics](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/metrics.md) in the node repository.

## Turn metrics on

1. Add a `metrics` section to `config.yaml`:

   ```yaml
   metrics:
     port: 9090
     token: "<at least 32 characters>"
   ```

   Generate the token with `openssl rand -hex 32`. It must be at least 32 characters and different from `auth.api_key`, or the node refuses to start.

2. Restart the node:

   ```bash
   cd /opt/wgkeeper && docker compose restart
   ```

## How the endpoint behaves

| Request | Response |
| --- | --- |
| `GET /metrics` with `Authorization: Bearer <token>` | `200` with the metrics |
| Missing or wrong token | `401`. Rejections are logged at most once a second |
| More than 5 requests per second (bursts up to 10), after the token check | `429` with `Retry-After: 1` |
| Any method other than `GET` | `405` |

The port listens on all interfaces. Keep it private; see [below](#keep-the-metrics-port-private).

## Scrape it with Prometheus

Run Prometheus in the same Compose project as the node and scrape `wireguard:9090` over the Docker network. [`docker-compose.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/docker-compose.yml) has a commented-out `prometheus` service that mounts the repository's example configs.

1. Write the token to a file next to `docker-compose.yml`. The file must exist before `docker compose up`, or Docker mounts an empty directory in its place. Prometheus runs as `nobody`, so make the file readable:

   ```bash
   openssl rand -hex 32 > ./wgkeeper-token
   chmod 644 ./wgkeeper-token
   ```

   Put the same value in `metrics.token`.

2. Copy [`examples/prometheus/prometheus.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/examples/prometheus/prometheus.yml) and [`examples/prometheus/alerts.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/examples/prometheus/alerts.yml) into `examples/prometheus/`. The install script doesn't download them.

3. Uncomment the `prometheus` service and the `prometheus_data` volume in `docker-compose.yml`. With the install script, put them in `docker-compose.override.yml` instead, because the script replaces `docker-compose.yml` on every update.

4. Start it:

   ```bash
   docker compose up -d
   ```

The scrape config reads the token from the file:

```yaml
scrape_configs:
  - job_name: wgkeeper
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/wgkeeper-token
    static_configs:
      - targets: ["wireguard:9090"]
```

## Alerts and dashboard

- [`examples/prometheus/alerts.yml`](https://github.com/wgkeeper/wgkeeper-node/blob/main/examples/prometheus/alerts.yml): alerting rules for a down node, a failed peer store rollback, a subnet over 90% used or full, failing peer operations, API server errors and bursts of client errors.
- [`examples/grafana/dashboard.json`](https://github.com/wgkeeper/wgkeeper-node/blob/main/examples/grafana/dashboard.json): a Grafana dashboard. In Grafana, open **Dashboards**, import the file and pick your Prometheus data source.

## Exported metrics

| Metric | Type | Labels | Use |
| --- | --- | --- | --- |
| `wgkeeper_peers` | gauge | `state` | Capacity and usage |
| `wgkeeper_peer_operations_total` | counter | `op`, `result` | Throughput and error rate |
| `wgkeeper_peer_operation_duration_seconds` | histogram | `op` | Latency of API peer operations (`create`, `rotate`, `delete`) |
| `wgkeeper_persist_rollback_total` | counter | `op` | Store writes rolled back after a failed device change |
| `wgkeeper_persist_rollback_failed_total` | counter | | Rollbacks that failed, so the store and the device disagree until the next restart. Alert on any increase |
| `wgkeeper_wireguard_rx_bytes_total` | counter | | Bytes received from all peers since the interface came up |
| `wgkeeper_wireguard_tx_bytes_total` | counter | | Bytes sent to all peers since the interface came up |
| `wgkeeper_wireguard_stale_peers` | gauge | | Peers with no handshake in the last 5 minutes, or none at all |
| `wgkeeper_http_requests_total` | counter | `method`, `path`, `status_class` | API traffic, error rate, bursts of `401` |
| `wgkeeper_http_request_duration_seconds` | histogram | `method`, `path` | Latency per endpoint |
| `process_*`, `go_*` | | | Standard process and Go runtime metrics |

### Label values

| Label | Values |
| --- | --- |
| `state` | `possible` (capacity of the subnets, capped at 2^53), `issued` (peers in the store), `active` (handshake in the last 2 minutes) |
| `op` | `create`, `rotate`, `delete`, `expire` |
| `result` | `success`, `error_no_ip`, `error_persist`, `error_device`, `error_unsupported_family`, `error_not_found`, `error_internal` |
| `path` | The route template, such as `/peers/:peerId`, so peer IDs don't create new series. Unknown routes are `unmatched`. `/healthz` and `/readyz` are counted too |
| `method` | `GET`, `POST`, `DELETE`, `HEAD`, `OPTIONS`, or `other` for any other method and for unknown routes |
| `status_class` | `2xx`, `3xx`, `4xx`, `5xx` |

If the node can't read the WireGuard device during a scrape, `wgkeeper_peers` and the `wgkeeper_wireguard_*` metrics are left out of that response rather than reported as zero.

Per-peer traffic and handshakes aren't exported, because a series per peer grows with every peer and flaps as peers come and go. Use `GET /peers` and `GET /peers/:peerId` from the [API](/docs/node/api) instead.

## Keep the metrics port private

Peer counts, version and capacity tell an attacker a lot, so keep the port off the internet even with the token.

:::danger

In Docker, never add `9090:9090` to the node's `ports:`. Scrape it from inside the Docker network.

:::

| Setup | What to do |
| --- | --- |
| Prometheus in the same Compose project | Scrape `wireguard:9090`, as above |
| Prometheus elsewhere | Add a separate site in your reverse proxy, for example `metrics.example.com`, with client certificate (mTLS) authentication that proxies to the metrics port |
| Bare metal | Allow `9090/tcp` in the firewall only from `127.0.0.1` or your Prometheus host |
