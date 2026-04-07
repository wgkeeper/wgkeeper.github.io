---
sidebar_position: 4
title: Managing Peers and Configs
---

import ScreenshotZoom from '@site/src/components/ScreenshotZoom';

# Managing Peers and Configs

Use this page when a node is already connected and you want to create client access.

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-node-peers-light.png"
  alt="WGKeeper peer management screen"
/>

## Peer workflow

1. Open the Node that should host the peer.
2. Open the peer list.
3. Create or select a peer.
4. Review the peer details.
5. Generate and download the client config.
6. Connect the client and verify the latest handshake.

## Manage peers

Use the peer list to find existing clients, inspect assigned addresses, and open detailed peer state. Keep peer names descriptive enough to identify the device or owner later.

When removing a peer, make sure the client no longer needs access. Removing the peer from the node invalidates that client configuration.

## Review peer details

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-peer-details-light.png"
  alt="WGKeeper peer details drawer"
/>

The details view helps you verify whether a client is actually being used:

- **Endpoint** shows the last remote address observed by WireGuard.
- **Latest handshake** shows when the peer last connected.
- **Transfer totals** show traffic sent and received by the peer.
- **Allowed IPs** show the addresses routed to the peer.

If the latest handshake is empty or old, check the client config, public endpoint, firewall rules, and the node WireGuard UDP port.

## Generate client config

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-config-generator-light.png"
  alt="WGKeeper WireGuard config generator"
/>

Generate a client config after the peer exists on the node.

Before sharing the config, check:

- The endpoint points to the public address and UDP port of the node.
- Allowed IPs match the routing model you want for the client.
- DNS is set only if your deployment needs a specific resolver.
- The peer is assigned to the expected node.

After the client imports the config, connect it and return to the Console to confirm that the latest handshake updates.

## Troubleshooting

- If config generation works but the client does not connect, check the node firewall and public UDP port.
- If the peer appears in the Console but disappears after node restart, enable `wireguard.peer_store_file`.
- If peer creation fails, check node health, API reachability, and address capacity.
