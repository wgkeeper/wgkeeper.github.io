---
title: Introduction
description: wgkeeper is a self-hosted WireGuard system for many servers. wgkeeper console is the web panel, and wgkeeper node runs on each WireGuard server.
slug: /
---

# wgkeeper

wgkeeper is a self-hosted [WireGuard®](https://www.wireguard.com/) system for many servers. You install it as a set: one wgkeeper console (the web panel) and a wgkeeper node on every WireGuard server.

## The two components

| | wgkeeper console | wgkeeper node |
| --- | --- | --- |
| What it is | Web panel | Go service with a REST API |
| How many | One per install | One on each WireGuard server |
| What it stores | Users, nodes and their encrypted API keys, in SQLite or PostgreSQL | Its peers, in a local bbolt file |
| Listens on | `127.0.0.1:8000` | API on `127.0.0.1:51821`, WireGuard on `51820/udp` |

The node owns one WireGuard interface and has no UI or user accounts. You can also drive it from your own service through the [node API](/docs/node/api) instead of the console.

## How they fit together

```text
        Admin (browser)
              │  HTTPS
              ▼
   ┌──────────────────────┐
   │   wgkeeper console   │
   └──────────┬───────────┘
              │  node API over HTTPS, X-API-Key header
      ┌───────┴────────┐
      ▼                ▼
 ┌──────────┐     ┌──────────┐
 │ wgkeeper │ ... │ wgkeeper │
 │   node   │     │   node   │
 └────▲─────┘     └────▲─────┘
      │ WireGuard 51820/udp
   VPN clients     VPN clients
```

- The console calls each node's API. Both components speak plain HTTP; a reverse proxy in front adds HTTPS, and the install scripts can set up Caddy for it.
- Peers live on the nodes. Each node restores them on its interface after every restart.
- Clients connect to the nodes directly. If the console is down, the VPN keeps working, and you can add the nodes to a new console with their API keys.

## What wgkeeper is not

- **Not a hosted service.** You run the console and the nodes on your own servers.
- **Not a WireGuard implementation.** The node uses the kernel's WireGuard and `wg-quick`.
- **Not a VPN client.** Users connect with any WireGuard app and the config the console generates.
- **Not a TLS terminator.** HTTPS and IP filtering come from the reverse proxy.

## Where to go next

| You want to | Start here |
| --- | --- |
| Set up the panel, a server and a client | [Quick start](/docs/quick-start) |
| Install the console | [Console installation](/docs/console/installation) |
| Add another server | [Node installation](/docs/node/installation) |
| Create peers and hand out configs | [Peers and configs](/docs/console/managing-peers-and-configs) |
| Fix a problem | [Troubleshooting](/docs/guides/troubleshooting) |
| Upgrade from 1.x | [Upgrading to 2.0](/docs/upgrading) |

## Project links

- Overview: [wgkeeper/wgkeeper](https://github.com/wgkeeper/wgkeeper)
- Console: [wgkeeper/wgkeeper-console](https://github.com/wgkeeper/wgkeeper-console)
- Node: [wgkeeper/wgkeeper-node](https://github.com/wgkeeper/wgkeeper-node)
- Documentation source: [wgkeeper/wgkeeper.github.io](https://github.com/wgkeeper/wgkeeper.github.io)

wgkeeper is licensed under AGPL-3.0. WireGuard® is a registered trademark of Jason A. Donenfeld.
