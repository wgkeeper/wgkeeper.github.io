---
sidebar_position: 1
title: Introduction
slug: /
---

# WGKeeper

WGKeeper is an open-source system for centralized WireGuard® server management.

It has two parts:

- **Console** is the central control plane
- **Node** runs on servers and applies configuration locally

Console provides the web admin interface. Node runs the local WireGuard® interface and exposes a REST API for peer management.

This documentation covers both the Console and Node components.

## Start here

- [Install the Console](/docs/console/installation)
- [Use the Console](/docs/console/using-the-console)
- [Manage peers and configs](/docs/console/managing-peers-and-configs)
- [Install a Node](/docs/node/installation)
- [Configure a Node](/docs/node/configuration)

## What WGKeeper is built for

- centralized orchestration across many nodes
- API-driven peer management
- secure deployments with API key authentication and optional IP allowlists

## Repositories

- Project: [wgkeeper/wgkeeper](https://github.com/wgkeeper/wgkeeper)
- Documentation: [wgkeeper/wgkeeper.github.io](https://github.com/wgkeeper/wgkeeper.github.io)
- Console: [wgkeeper/wgkeeper-console](https://github.com/wgkeeper/wgkeeper-console)
- Node: [wgkeeper/wgkeeper-node](https://github.com/wgkeeper/wgkeeper-node)
