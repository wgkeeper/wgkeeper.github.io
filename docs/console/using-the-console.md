---
sidebar_position: 3
title: Using the Console
---

import ScreenshotZoom from '@site/src/components/ScreenshotZoom';

# Using the Console

Use this page after the Console and at least one Node are already running.

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-nodes-light.png"
  alt="WGKeeper Console showing nodes, status, versions, and updates"
/>

## Typical workflow

1. Install and start WGKeeper Console.
2. Install and start a WGKeeper Node.
3. Add the Node to the Console.
4. Check that the Node is healthy.
5. Create peers and generate client configs.
6. Monitor handshakes, transfer totals, and capacity over time.

## Add a node

When adding a node, use the API endpoint and API key from that Node deployment.

- **API endpoint** is the HTTP or HTTPS URL the Console uses to reach the Node API.
- **API key** must match `auth.api_key` in the Node `config.yaml`.
- **Name** should identify the server or location clearly enough for operators.

## Read node status

The nodes screen gives you the operating state of each server:

- **Status** shows whether the Console can reach the Node API.
- **Version** helps you spot nodes that need updates.
- **Peer capacity** shows how much address space is still available for new peers.
- **Last check** helps separate a current issue from an old stale state.

If a node appears offline, first check the Node container, API endpoint reachability from the Console, and saved API key.

## Open a node

Open a node before creating peers or changing client configs.

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-node-overview-light.png"
  alt="WGKeeper node overview with health and capacity metrics"
/>

Use the overview to confirm the WireGuard interface, address allocation, current peer counts, and remaining capacity.

## Before production use

- The Console URL should be served over HTTPS in production.
- Each Node should expose WireGuard UDP traffic on its public port.
- The Node API should be reachable by the Console, not necessarily by every public client.
- `auth.api_key` on the Node must match the value saved in the Console.
- Peer persistence should be enabled on the Node if peers must survive restarts.

See [Node Configuration](/docs/node/configuration) for `auth.api_key`, `server.allowed_ips`, and `wireguard.peer_store_file`.
