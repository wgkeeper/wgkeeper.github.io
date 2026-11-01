---
title: Peers and configs
description: Browse peers on a node, read peer details, rotate keys, delete peers, and generate and download WireGuard client configs in wgkeeper console.
---

import ScreenshotZoom from '@site/src/components/ScreenshotZoom';

# Peers and configs

Peers live on the nodes, and wgkeeper console reads and changes them through each node's API. You manage them on a node's page, under the **Peers** and **Config** tabs.

## Peer list

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-node-peers-light.png"
  srcDark="/img/screenshots/wgkeeper-node-peers-dark.png"
  alt="wgkeeper console peers tab with filters and peer table"
/>

The **Peers** tab lists the node's peers page by page: 25, 50, 100 or 250 per page (**Rows per page**, 50 by default).

| Column | Meaning |
| --- | --- |
| Peer | Short form of the peer ID |
| Allowed IPs | The peer's addresses on the node |
| Public key | The peer's WireGuard public key |
| Status | **Active** when the node saw a handshake in the last 2 minutes, otherwise **Inactive** |
| Last handshake | When the peer last connected |
| Created | When the peer was created. Click the header to sort; newest first by default |
| Expires | When the node removes the peer, or **Never**. Highlighted when it is less than 3 days away |

| Control | Action |
| --- | --- |
| Filter box | Filters the current page by ID, IP or key |
| **All**, **Active**, **Inactive** | Shows peers by status, on the current page |
| Counter | Total peers on the node, and how many on this page are active |
| Reload button | Fetches the list again |
| Row menu **⋯** | **Details**, **Copy peer ID**, **Copy public key**, **Delete peer** |

## Peer details

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-peer-details-light.png"
  srcDark="/img/screenshots/wgkeeper-peer-details-dark.png"
  alt="wgkeeper console peer details panel with status, traffic and dates"
/>

Click a peer to open its details panel:

| Field | Shows |
| --- | --- |
| Peer ID | Full ID, with a copy button |
| Status, Last handshake | As in the list, with the exact date |
| Allowed IPs | The peer's addresses |
| Public key | With a copy button |
| Received, Sent | Traffic from the node's kernel counters, when the node reports them |
| Created, Expires | With exact dates |
| Address families | IPv4, IPv6 or both |

If the last handshake is empty or old, check the client config, the node's public address and WireGuard UDP port, and firewall rules.

## Rotate keys

Rotate keys when a device's config may have leaked or you want to reissue it.

1. Click **Rotate keys** at the bottom of the details panel and confirm.
2. The node issues new keys and keeps the peer's IP address and expiry date. The config the device uses now stops connecting.
3. Copy the new config from the panel or click **Download**, and give it to the device.

The rotated config always lists Cloudflare's DNS servers, whatever the previous config had. To set other DNS servers, rotate from the **Config** tab instead: enter the peer's ID and your DNS servers there.

Neither the console nor the node keeps the private key. If you lose the config, rotate the keys again.

## Delete a peer

Choose **Delete** in the details panel or **Delete peer** in the row's **⋯** menu, and confirm. The node removes the peer and its config stops working. This can't be undone.

## Generate a client config

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-config-generator-light.png"
  srcDark="/img/screenshots/wgkeeper-config-generator-dark.png"
  alt="wgkeeper console config tab with the new client config form and generated config"
/>

1. Open the **Config** tab, or click **New config** in the node header.
2. Fill in the form; the fields are below.
3. Click **Generate config**.
4. Copy the config, or click **Download** to save it as `wgkeeper-<peer>.conf`, named after the short peer ID.

The console creates the peer on the node and shows its config. The **Peer ID** field then gets a new ID for the next config.

| Field | Default | Description |
| --- | --- | --- |
| Peer ID | a new UUID v4 | Must be a UUID v4; map it to a user or device. **New** fills in another one. An existing peer's ID rotates that peer's keys and keeps its IP address |
| Expires | empty | Optional date and time, in your local time, when the node removes the peer. A date alone means the end of that day. Must be in the future. Empty means a permanent peer, or no change when you rotate an existing peer |
| Address families | every family the node has | **IPv4**, **IPv6** or both. Shown only when the node has both |
| DNS servers | Cloudflare: `1.1.1.1`, `1.0.0.1`, `2606:4700:4700::1111`, `2606:4700:4700::1001` | Two IPv4 fields and two IPv6 fields, for the families the node has. Each value must be an IP address. Servers of a family the peer has no address in are left out of the config |

:::warning[Clearing every DNS field doesn't remove DNS]

The form says you can clear the fields to omit DNS. If every DNS field is empty, the console still writes Cloudflare's servers into the config. To use other servers, enter them; a config without a `DNS` line isn't possible.

:::

:::danger[The private key is shown once]

Neither the console nor the node keeps the peer's private key. Save the config or import it into the WireGuard app before you leave the page.

:::

### What the config contains

```ini
[Interface]
PrivateKey = <peer private key>
Address = 10.20.3.46/32, fd20::32e/128
DNS = 1.1.1.1, 1.0.0.1, 2606:4700:4700::1111, 2606:4700:4700::1001

[Peer]
PublicKey = <node public key>
PresharedKey = <preshared key>
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = edge-ams-01.nodes.example.net:51820
PersistentKeepalive = 25
```

| Line | Value |
| --- | --- |
| `Address` | The peer's addresses on the node |
| `DNS` | The DNS servers from the form, for the peer's address families |
| `AllowedIPs` | `0.0.0.0/0` and `::/0`: all traffic through the tunnel, for each address family the peer has an address in |
| `Endpoint` | The host of the node address in the console, with the node's WireGuard listen port |
| `PresharedKey` | A preshared key the node generates for each peer |
| `PersistentKeepalive` | 25 seconds |

## Connect a client

Import the `.conf` file into a WireGuard desktop or mobile app. With `wg-quick` on Linux, the interface is named after the file and limited to 15 characters, so install it under a short name:

```bash
sudo install -m 600 wgkeeper-1b5a0c1c.conf /etc/wireguard/wgk0.conf
sudo wg-quick up wgk0
```

In the **Peers** tab, the peer turns **Active** and **Last handshake** updates.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Client doesn't connect | The node's UDP port (`51820` by default) is open in every firewall in front of it, and the **Endpoint** host resolves to the node |
| Client connects but can't reach a private network | Peers reach the internet only by default. See [Peer isolation](/docs/node/security#peer-isolation) |
| "The node has no free addresses left in its subnets." | The node's subnet is full. Delete unused peers or use a larger subnet |
| "This node does not support the selected address family." | Pick a family the node has |
| "The node no longer accepts this console's API key." | The node's `auth.api_key` changed. Remove the node and add it again with the new key |
