---
title: Troubleshooting
description: Common wgkeeper failures with their cause and fix, from install script errors to node API error codes.
---

# Troubleshooting

Each entry is what you see, then the cause and the fix. Node logs: `docker compose logs wireguard` in `/opt/wgkeeper`. Console logs: `docker compose logs console` in `/opt/wgkeeper-console`.

## Install

### `the kernel has no WireGuard support`

The node script could not load the `wireguard` module. Use Linux 5.6 or newer, or install the module for your kernel.

### `Docker Compose v2 is required (docker compose)`

Docker is installed without the Compose plugin. Install `docker-compose-plugin`.

### `could not find the latest release; pass --version`

The script could not reach the GitHub API. Pass the version yourself, for example `--version 2.0.0`.

### `could not download ... (the installer supports 2.0.0 and newer)`

The `--version` is older than 2.0.0, or the server cannot reach `raw.githubusercontent.com`.

### `the node did not become ready` or `the console did not become ready`

`/readyz` did not answer within 60 seconds. Run the logs command the script prints; the error names the cause.

### Node log: `unknown field "..."`

`config.yaml` has a key the node does not know, often a typo. Remove it. See [Node configuration](/docs/node/configuration).

### Node log: `... removed in 2.0.0`

The config has a key removed in 2.0.0. Move TLS and IP filtering to a reverse proxy first, then remove the key. See [Upgrading to 2.0](/docs/upgrading).

### Node log: `at least one of wireguard.subnet or wireguard.subnet6 is required`

Set `wireguard.subnet`, `wireguard.subnet6`, or both.

### Node log: `auth.api_key must be at least 32 characters`

Use a longer key, for example from `openssl rand -hex 32`.

### Node log: `stored peer(s) have addresses outside the configured subnets`

The subnet changed while peers hold addresses from the old one. The node deletes nothing and stops. Restore the previous subnet, delete those peers through the API, then change it.

### Node log: `peer store has ... address conflict(s)`

A stored peer holds the server address or another peer's address. Fix `wireguard.server_ip` / `server_ip6`, or delete the conflicting peers.

### Node log: `no PrivateKey found`

The WireGuard config in `/opt/wgkeeper/wireguard/` lost its server key. Restore it from a backup. Deleting the file creates a new server key, and every client then needs a new config.

### Node log: `no default route found to detect the WAN interface`

Set `wireguard.routing.wan_interface`.

## Adding a node

### "The node did not respond. Check the address."

The console calls `/readyz` and then `/stats` on the node, with 2 to 2.5 seconds for each. Test from the console server:

```bash
curl -fsS https://node1.example.com/readyz
```

Common causes:

- The node was installed without `--domain`, so its API listens on `127.0.0.1` only.
- The address redirects, for example `http://` to `https://`. The console does not follow redirects.
- The address is, or resolves to, a link-local or cloud metadata address such as `169.254.169.254`. The console refuses those.
- `/readyz` returns `503` because the WireGuard interface cannot be read.

### "The node rejected this API key."

The node answered `401`. Copy `auth.api_key` from `/opt/wgkeeper/config.yaml`.

### "A node with this address is already in the console."

Each address can be added once.

### A node shows as Offline

The list shows the last check. Click **Refresh** on the **Nodes** page. A refresh gives up after 20 seconds, and nodes it did not finish keep their last status. A node that rejects the stored key also shows as offline.

### A node shows as Outdated

It runs an older version than the latest wgkeeper node release on GitHub. The console checks GitHub at most every 10 minutes. Run the node install script again. Console 2.0 needs node 2.0.0 or newer.

## Clients

### The peer stays Inactive, Last handshake is Never

- `51820/udp` is closed. The node script opens it only in an active `ufw`; open it in your cloud firewall.
- The config's `Endpoint` is the host of the node address in the console. If you added the node by an internal name or IP, remove it and add it again by its public name.
- The peer expired. The node removes expired peers every minute.
- The keys were rotated. Generating a config with an existing **Peer ID** rotates its keys, and the old config stops working.

A peer is **Active** when its last handshake is under 2 minutes old.

### The tunnel works, but private networks do not

Peers cannot reach private networks by default, including a DNS server on your LAN. Set `wireguard.routing.allow_private_networks: true`. See [Node security](/docs/node/security).

### `wg-quick up` fails on the downloaded file

`wg-quick` uses the file name as the interface name, which Linux limits to 15 characters. Rename it, for example to `/etc/wireguard/wgk0.conf`.

## Node API errors

Errors look like `{"error": "<message>", "code": "<code>"}`. Full list: [Node API](/docs/node/api).

### `401 unauthorized`

`X-API-Key` is missing or does not match `auth.api_key`.

### `409 peer_expired`

You rotated an expired peer without a new `expiresAt`. Pass a future `expiresAt`, or delete the peer.

### `409 no_available_ip`

The subnet is full. Delete unused peers, or switch to a larger subnet that contains the current one.

### `400 unsupported_address_family`

The request asked for an address family the node has no subnet for.

### `400 invalid_json`

The body has an unknown field, such as `expires_at` instead of `expiresAt`, or trailing data.

### `503 device_timeout`

The WireGuard device did not answer in time. The change is kept and reaches the device when it recovers. Retrying is safe.

### `503 device_busy`

A device call is stuck. Nothing changed; retry.
