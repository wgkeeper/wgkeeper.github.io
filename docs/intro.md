---
sidebar_position: 1
title: Introduction
slug: /
---

# WGKeeper

WGKeeper is an open-source system for centralized WireGuard® server management.

![WGKeeper Console showing nodes, status, versions, and updates](/img/screenshots/wgkeeper-nodes-light.png)

It has two parts:

- **Console** is the central control plane
- **Node** runs on servers and applies configuration locally

WGKeeper Console provides the web admin interface, while WGKeeper Node runs the local WireGuard® interface and exposes a REST API for peer management.

This documentation covers both the Console and Node components.

## What you can find here

- What WGKeeper is
- How to run a node
- How to configure a node
- Which deployment option to choose

## What the Node is built for

- centralized orchestration across many nodes
- API-driven peer management
- secure deployments with API key authentication and optional IP allowlists

## Repositories

- Project: [wgkeeper/wgkeeper](https://github.com/wgkeeper/wgkeeper)
- Documentation: [wgkeeper/wgkeeper.github.io](https://github.com/wgkeeper/wgkeeper.github.io)
- Console: [wgkeeper/wgkeeper-console](https://github.com/wgkeeper/wgkeeper-console)
- Node: [wgkeeper/wgkeeper-node](https://github.com/wgkeeper/wgkeeper-node)
