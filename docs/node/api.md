---
title: API
description: The wgkeeper node REST API at a glance - endpoints, API key authentication, creating and rotating peers, and error codes.
---

# Node API

wgkeeper node is managed entirely through a small REST API, which wgkeeper console uses and your own service can call. The full reference is [API reference](https://github.com/wgkeeper/wgkeeper-node/blob/main/docs/api.md) in the node repository.

## Basics

| | |
| --- | --- |
| Transport | JSON over plain HTTP on `server.port` (default `51821`). For HTTPS, see [Reverse proxy and HTTPS](/docs/guides/reverse-proxy) |
| Authentication | The API key (`auth.api_key`) in the `X-API-Key` header, on every endpoint except `/healthz` and `/readyz` |
| Request ID | Every response has an `X-Request-Id` header, and the node's log lines for that request carry the same ID. Send your own UUID v4 in `X-Request-Id` to reuse it; any other value is replaced |
| Limits | Request bodies up to 256 KB, headers up to 16 KB, 30 seconds to read the request and 30 seconds to write the response |

## Endpoints

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| `GET` | `/healthz` | public | `200 {"status": "ok"}` while the process is up |
| `GET` | `/readyz` | public | `200 {"status": "ok"}` when the WireGuard device can be read, otherwise `503 {"status": "unhealthy", "reason": "wireguard_unavailable"}` |
| `GET` | `/stats` | required | Node, interface and peer counts. See [below](#get-stats) |
| `GET` | `/peers` | required | Peers, paginated. See [below](#get-peers) |
| `GET` | `/peers/:peerId` | required | One peer, with traffic counters |
| `POST` | `/peers` | required | Create a peer or rotate its keys |
| `DELETE` | `/peers/:peerId` | required | Delete a peer. Returns `200 {"status": "ok"}` |

A path the API doesn't have returns `404` with a plain-text body, not JSON. Handshake times and traffic counters can be up to 5 seconds old, because the node caches device reads for that long.

### GET /stats

| Field | Description |
| --- | --- |
| `service.name`, `service.version` | `wgkeeper-node` and the running version |
| `wireguard.interface`, `wireguard.listenPort` | Interface name and UDP port |
| `wireguard.subnets`, `wireguard.serverIps` | Configured subnets and the server's address in each |
| `wireguard.addressFamilies` | `IPv4`, `IPv6` or both, depending on the subnets |
| `peers.possible` | How many peers the subnets can hold. Capped at 2^53 for very large subnets |
| `peers.issued` | Peers in the store |
| `peers.active` | Peers with a handshake in the last 2 minutes |
| `startedAt` | When the node process started, RFC 3339 |

### GET /peers

Query parameters: `offset` (default `0`, at least `0`) and `limit` (default `100`, `1` to `1000`). The response is `{"data": [...], "meta": {...}}`.

| Peer field | Description |
| --- | --- |
| `peerId` | The ID the orchestrator chose |
| `publicKey` | The peer's public key |
| `allowedIPs`, `addressFamilies` | The peer's addresses (`/32` and `/128`) and their families |
| `active` | `true` with a handshake in the last 2 minutes |
| `lastHandshakeAt` | Time of the last handshake, or `null` if there was none |
| `createdAt` | When the peer was created, RFC 3339 |
| `expiresAt` | Expiry, RFC 3339. Absent for a permanent peer |
| `receiveBytes`, `transmitBytes` | Traffic counters. Only in `GET /peers/:peerId` |

`meta` has `offset`, `limit`, `totalItems`, `hasPrev`, `hasNext`, and `prevOffset` and `nextOffset` when there is a previous or next page.

## Create a peer

The orchestrator picks the peer ID, a UUID v4:

```bash
curl -X POST http://127.0.0.1:51821/peers \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"peerId": "8f0c6a52-3b7e-4d4f-9a61-2f5c1d7e9b10", "expiresAt": "2026-11-30T00:00:00Z"}'
```

| Field | Required | Description |
| --- | --- | --- |
| `peerId` | yes | UUID v4 chosen by the orchestrator |
| `expiresAt` | no | Future RFC 3339 time when the node removes the peer. Omit, or send `""`, for a permanent peer |
| `addressFamilies` | no | `["IPv4"]`, `["IPv6"]` or `["IPv4", "IPv6"]`. Omit to get every family the node has a subnet for |

The `200` response has everything a client config needs: the server's public key and listen port, and the peer's keys and addresses. It is sent with `Cache-Control: no-store`.

```json
{
  "server": { "publicKey": "<base64>", "listenPort": 51820 },
  "peer": {
    "peerId": "8f0c6a52-3b7e-4d4f-9a61-2f5c1d7e9b10",
    "publicKey": "<base64>",
    "privateKey": "<base64>",
    "presharedKey": "<base64>",
    "allowedIPs": ["10.0.0.2/32"],
    "addressFamilies": ["IPv4"]
  }
}
```

:::warning[The private key is returned once]

The node doesn't store the peer's private key, so this response is the only place you get it.

:::

Unknown fields, an empty body and anything after the JSON object return `400 invalid_json`. A misspelled `expires_at` therefore can't silently create a permanent peer.

## Rotate keys

Send `POST /peers` again with the same `peerId`. The node issues a new key pair and preshared key, and the old client config stops connecting.

| Field | On rotation |
| --- | --- |
| IP addresses | Kept, so firewall rules that reference them keep working |
| `addressFamilies` | Ignored |
| `expiresAt` | Replaced if you send one, kept if you omit it |

For a peer whose expiry has passed, send a new future `expiresAt`, or you get `409 peer_expired`.

## Errors

Errors are JSON with a message and a stable code. Match on `code`; the message may change.

```json
{ "error": "<message>", "code": "<code>" }
```

| Status | Code | When |
| --- | --- | --- |
| `400` | `invalid_json` | The body isn't exactly one JSON object, or has unknown fields |
| `400` | `invalid_peer_id` | `peerId` in the body or the path isn't a UUID v4 |
| `400` | `invalid_expires_at` | `expiresAt` isn't RFC 3339 or isn't in the future |
| `400` | `invalid_address_family` | `addressFamilies` has an unknown or repeated value |
| `400` | `unsupported_address_family` | The node has no subnet for a requested family |
| `400` | `invalid_pagination` | `offset` or `limit` is out of range |
| `401` | `unauthorized` | The `X-API-Key` header is missing or wrong |
| `404` | `peer_not_found` | No peer with this `peerId` |
| `409` | `no_available_ip` | The subnet has no free addresses |
| `409` | `peer_expired` | Rotating an expired peer without a new future `expiresAt` |
| `413` | `body_too_large` | The body is over 256 KB |
| `503` | `device_timeout` | The WireGuard device didn't respond within 10 seconds. A change is kept in the store and reaches the device when it recovers; retrying is safe |
| `503` | `device_busy` | An earlier device call is still stuck. Nothing was changed; retry later |
| `500` | `wireguard_error`, `stats_unavailable`, `peers_list_unavailable`, `server_info_unavailable`, `internal_error` | Unexpected failure. The details are in the node's log under the request ID |

Error details are never returned to the client, even with `DEBUG` on. Look up the `X-Request-Id` in the node's log:

```bash
cd /opt/wgkeeper && docker compose logs wireguard | grep <request-id>
```
