---
title: Upgrading to 2.0
description: Upgrade wgkeeper node and wgkeeper console from 1.x to 2.0, with the steps first and every breaking change grouped by component.
---

# Upgrading to 2.0

wgkeeper node 2.0.0 and wgkeeper console 2.0.0 have breaking changes. Follow the steps, then check the [breaking changes](#breaking-changes) that apply to your setup.

## Before you start

- Console 2.0 requires node 2.0.0 or newer. Upgrade every node and the console in the same maintenance window.
- Upgrade the nodes first. The VPN keeps working while the console is down, because clients connect to the nodes directly.
- The install scripts support 2.0.0 and newer only, so a 1.x install is upgraded by hand once.

## Upgrade the nodes

1. **Back up** `config.yaml`, the `./wireguard` directory (it holds the server private key) and your peer store file, if you had one.
2. **Move TLS and IP filtering to a reverse proxy** first, so the node is not left exposed. See [Reverse proxy](/docs/guides/reverse-proxy).
3. **Edit `config.yaml`.** Remove `server.tls_cert`, `server.tls_key`, `server.allowed_ips`, `server.trusted_proxies`, `metrics.per_peer` and `metrics.per_peer_max`. Check that `auth.api_key` has at least 32 characters. If clients need private networks, set `wireguard.routing.allow_private_networks: true`.
4. **Keep your peers.** If you used `peer_store_file: "/app/peers/peers.db"` with a `./peers` volume, keep both, or move `peers.db` into `./data` and remove `peer_store_file`.

   :::danger[Peers not in the store are removed]

   On startup the node removes every peer on the interface that is not in its peer store. A 1.x node that ran without `peer_store_file` starts with an empty store, so its clients need new configs.

   :::

5. **Replace the Compose files** with the 2.0 ones and start the node:
   - Without a proxy: `docker compose up -d`.
   - With Caddy: move your edits to `examples/caddy/Caddyfile`, then run `docker compose -f docker-compose.yml -f examples/caddy/compose.yml up -d`.
   - With your own proxy: point it at `127.0.0.1:51821` on the host or `wireguard:51821` in Docker.
6. **Check the node.** On the node server, `curl -fsS http://127.0.0.1:51821/readyz` returns `{"status":"ok"}`. If the node does not start, `docker compose logs wireguard` names the key or peer that stopped it. See [Troubleshooting](/docs/guides/troubleshooting).
7. **Update monitoring.** Switch log queries to snake_case keys and drop per-peer panels. Take the Prometheus config, alerting rules and dashboard from `examples/` in the node repository.

## Upgrade the console

These steps follow [Upgrading from 1.x](https://github.com/wgkeeper/wgkeeper-console/blob/main/CHANGELOG.md#upgrading-from-1x) in the console changelog.

1. **Back up the database and note your `SECRET_KEY`.**
2. **Stop the old stack** with `docker compose down`. The volume is kept.
3. **Replace `docker-compose.yml`** with the 2.0 one and create `console.env` from `console.env.example`. Put your old `SECRET_KEY` there, with any other settings you passed to the old `app` service.

   :::danger[Keep the same SECRET_KEY]

   With a different `SECRET_KEY`, the stored node API keys cannot be decrypted.

   :::

4. **Copy the database into the new volume.** Volume names start with the Compose project name, by default the folder name; `docker volume ls` shows them.

   ```bash
   docker volume create <project>_console_data
   docker run --rm -v <project>_wg-keeper-data:/from -v <project>_console_data:/to alpine cp -a /from/. /to/
   ```

5. **Start the console.**
   - With the bundled Caddy: move your edits to `examples/caddy/Caddyfile` and run `docker compose -f docker-compose.yml -f examples/caddy/compose.yml up -d`.
   - With your own proxy: run `docker compose up -d`, point the proxy at `127.0.0.1:8000`, and set `TRUSTED_PROXIES` and `COOKIE_SECURE=true`. See [Console configuration](/docs/console/configuration).
6. **Sign in again.** Sessions from 1.x are not valid in 2.0.

## Moving a 1.x node to the install script

Once a node runs 2.0, the install script can manage it. The script never overwrites `config.yaml`, `./wireguard` or `./data`, and it replaces `docker-compose.yml` on every run.

1. Stop the old stack with `docker compose down`.
2. Copy `config.yaml`, the `wireguard` directory and `data/peers.db` into `/opt/wgkeeper`. Remove a custom `peer_store_file` so the store is in the default `./data` mount.
3. Run the [install script](/docs/node/installation), with `--domain` if you want Caddy in front of the API.

Later runs update the node. Put your own Compose changes in `docker-compose.override.yml`; the script includes it.

## Breaking changes

Full notes: [node changelog](https://github.com/wgkeeper/wgkeeper-node/blob/main/CHANGELOG.md), [console changelog](https://github.com/wgkeeper/wgkeeper-console/blob/main/CHANGELOG.md).

<details>
<summary>Node: config</summary>

- Removed `server.tls_cert` and `server.tls_key`. Terminate TLS in a reverse proxy.
- Removed `server.allowed_ips` and `server.trusted_proxies`. Filter clients in the proxy or the firewall.
- Removed the per-IP API rate limit. `/metrics` keeps its own.
- Removed `metrics.per_peer` and `metrics.per_peer_max`.
- Unknown keys, including removed ones, stop the node with an error naming the key.
- `wireguard.interface` must be a Linux interface name of up to 15 characters.
- New defaults: `server.port` `51821`, `wireguard.interface` `wg0`, `wireguard.listen_port` `51820`, `wireguard.routing.wan_interface` the default route's interface.

</details>

<details>
<summary>Node: peers and startup</summary>

- Peers are always persisted, to `/var/lib/wgkeeper/peers.db` by default. The in-memory store is gone.
- Peers are isolated from other peers, the node, cloud metadata and private networks. See [Node security](/docs/node/security).
- Stored peers outside the configured subnets are no longer deleted; startup fails instead.
- Startup fails when a stored peer holds the server address or shares an address with another peer.
- The WireGuard config is rewritten from `config.yaml` on every start; manual edits are lost. The node refuses to start if the file has no valid `PrivateKey`.

</details>

<details>
<summary>Node: deployment files</summary>

- No bundled proxy. `docker-compose.local.yml` is now `docker-compose.yml`, with the API on `127.0.0.1:51821` only.
- `docker-compose.prod-secure.yml` and the `Caddyfile` moved to `examples/caddy/`. nginx is in `examples/nginx/`.
- No `SYS_MODULE`, and `no-new-privileges` is set. On kernels older than 5.6, run `modprobe wireguard` on the host.
- Example configs moved from `docs/` to `examples/`. `prometheus.yml` uses `authorization.credentials_file`.

</details>

<details>
<summary>Node: API</summary>

- `POST /peers` rejects unknown JSON fields and trailing data with `400 invalid_json`.
- Invalid `addressFamilies` return `400 invalid_address_family` instead of `500`.
- `401` responses have `"code": "unauthorized"`.
- `DEBUG` no longer adds a `detail` field to responses.
- Rotating an expired peer without a new `expiresAt` returns `409 peer_expired`.
- New codes `503 device_timeout` and `503 device_busy`. See [Node API](/docs/node/api).
- No `X-XSS-Protection` or `Strict-Transport-Security` headers. Send HSTS from the proxy.

</details>

<details>
<summary>Node: logs and metrics</summary>

- Log keys are snake_case: `peer_id`, `public_key`, `allowed_ips`, `address_families`, `expires_at`.
- Removed series: `wgkeeper_peer_rx_bytes_total`, `wgkeeper_peer_tx_bytes_total`, `wgkeeper_peer_last_handshake_seconds`, `wgkeeper_peers_capped`.
- Failed device changes count as `result="error_device"` instead of `error_internal`.

</details>

<details>
<summary>Console: deployment files</summary>

- `docker-compose.yml` runs the published `ghcr.io/wgkeeper/console` image.
- The service is `console` instead of `app`; the volume is `console_data` instead of `wg-keeper-data`.
- Settings come from `console.env`. `.env.example` is now `console.env.example`.
- The port is published on `127.0.0.1:8000` only.
- The bundled Caddy moved to `examples/caddy/`, next to an nginx example.

</details>

<details>
<summary>Console: settings and sessions</summary>

- Invalid environment variables stop the console at startup. `SESSION_TTL=7d` used to become 24 hours.
- Sessions from 1.x are not accepted.
- Logout and password changes end every session of the user. Sessions end 7 days after login.

</details>

<details>
<summary>Console: API and node connections</summary>

- Generating a config is `POST /api/nodes/:id/config` instead of `GET`.
- Until the bootstrap password is changed, the API accepts only the password change.
- Cross-site state-changing requests are refused; request bodies must be JSON.
- Node errors: `404 node_not_found`, or `502` with the node's status in the body.
- The console does not follow redirects from nodes.
- Node addresses with credentials in the URL, or at link-local or cloud metadata addresses, are refused.

</details>
