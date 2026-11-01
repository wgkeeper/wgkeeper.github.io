---
title: Metrics and logs
description: Health checks, request IDs and log format in wgkeeper console, and how to enable and scrape its Prometheus metrics.
---

# Console metrics and logs

How to check wgkeeper console's health, read its logs and scrape its optional Prometheus metrics.

## Health checks

| Endpoint | Answers | Used by |
| --- | --- | --- |
| `GET /healthz` | `200 {"status":"ok"}` while the process is up | The image's `HEALTHCHECK`, every 30 seconds |
| `GET /readyz` | `200 {"status":"ok"}` when the database answers a ping within 2 seconds, otherwise `503 {"status":"unavailable"}` | The Compose health check, every 10 seconds, and the install script |

Both are on the main port. They need no sign-in, don't count toward rate limits and don't appear in the request log.

## Logs

The console logs to stdout. Read them with:

```bash
cd /opt/wgkeeper-console && docker compose logs -f console
```

| Setting | Effect |
| --- | --- |
| `LOG_FORMAT=text` (default) | `key=value` lines |
| `LOG_FORMAT=json` | One JSON object per line, for log collectors |
| `DEBUG=true` | Debug-level lines, including SQL queries with placeholders, never values |

Each request writes one `http request` line with these fields:

| Field | Value |
| --- | --- |
| `method` | HTTP method |
| `path` | Request path, without the query string |
| `route` | Route template, such as `/api/nodes/:id/peers`; empty for unknown paths |
| `status` | Response status |
| `latency_ms` | Time to answer, in milliseconds |
| `client_ip` | Client address; behind a proxy, set [`TRUSTED_PROXIES`](/docs/console/configuration#behind-a-reverse-proxy) to get the real one |
| `request_id` | The request ID, see below |

| Status | Level |
| --- | --- |
| `5xx` | error |
| `4xx` | warning, except `404` for a path the console doesn't have (info) |
| Other, under `/api/` | info |
| Other, outside `/api/` (the UI and its files) | debug |

Besides request lines, the console logs failed node requests with `node_id`, console errors, recovered panics with a stack, SQL queries slower than 500 ms, and rejected metrics scrapes. Logs never contain request headers, cookies or SQL values.

### Request IDs

Every response has an `X-Request-Id` header, and every log line for that request has the same `request_id`. A client-supplied `X-Request-Id` is kept only if it is a UUID v4.

When a request fails in the browser, copy the ID from the network tab and search the logs:

```bash
cd /opt/wgkeeper-console && docker compose logs console | grep <request-id>
```

## Prometheus metrics

Metrics are off until you set `METRICS_PORT`. To turn them on:

1. Add to `console.env`. Generate the token with `openssl rand -hex 32`:

   ```ini
   METRICS_PORT=9100
   METRICS_TOKEN=<at least 32 characters>
   ```

2. Recreate the container with `docker compose up -d`. With `METRICS_PORT` set and no valid token, the console doesn't start.
3. Point Prometheus at `console:9100` from the same Docker network, with the token as a bearer token.

| Endpoint property | Value |
| --- | --- |
| Address | `GET /metrics` on `METRICS_PORT`, all interfaces inside the container |
| Authentication | `Authorization: Bearer <METRICS_TOKEN>`, separate from console sign-in. Anything else gets `401` |
| Rate limit | 5 requests per second for all clients together, bursts of 10. Over it, `429` |
| Methods | `GET` only |

[`examples/prometheus/`](https://github.com/wgkeeper/wgkeeper-console/tree/main/examples/prometheus) has a scrape config that reads the token from a file:

```yaml
scrape_configs:
  - job_name: wgkeeper-console
    authorization:
      credentials_file: /etc/prometheus/console-metrics-token
    static_configs:
      - targets: ["console:9100"]
```

### Metric reference

| Metric | Type | Labels | Use |
| --- | --- | --- | --- |
| `wgkeeper_console_nodes` | gauge | `status` = `online`, `offline` | Stored nodes by their last known status |
| `wgkeeper_console_node_requests_total` | counter | `op`, `result` | Requests to nodes and the release check. Alert on `error_unreachable` and `error_unauthorized` |
| `wgkeeper_console_node_request_duration_seconds` | histogram | `op` | How fast nodes answer |
| `wgkeeper_console_http_requests_total` | counter | `method`, `path`, `status_class` | Request traffic and error rate |
| `wgkeeper_console_http_request_duration_seconds` | histogram | `method`, `path` | Request latency |
| `process_*`, `go_*` | | | Standard process and Go runtime metrics |

| Label | Values |
| --- | --- |
| `op` | `health`, `stats`, `list_peers`, `get_peer`, `create_peer`, `delete_peer`, `release_check`, `other` |
| `result` | `success`, `error_unauthorized` (node answered `401` or `403`), `error_upstream` (other `4xx` or `5xx`), `error_unreachable` (no answer) |
| `path` | The route template, such as `/api/nodes/:id/peers`, so IDs don't create new series. Unknown paths count as `unmatched` |
| `method` | `GET`, `POST`, `DELETE`, `HEAD`, `OPTIONS`, or `other` |
| `status_class` | `2xx`, `3xx`, `4xx`, `5xx` |

:::note[The nodes gauge changes only on a refresh]

The console checks node status only when you add a node or someone clicks **Refresh**; see [How status works](/docs/console/using-the-console#how-status-works). `wgkeeper_console_nodes` shows the result of the last check, not the state right now.

:::

The examples also include alerting rules for a down console, offline nodes, a rejected node API key, unreachable nodes and server errors. For peers, traffic and handshakes, scrape the nodes directly; see [Node metrics](/docs/node/metrics).

### Keep the metrics port private

:::danger[Don't publish the metrics port]

Don't publish the metrics port on the host. Run Prometheus in the same Docker network and scrape `console:9100`.

:::

If Prometheus runs elsewhere, put a separate proxy site with client-certificate (mTLS) authentication in front of the metrics port.
