---
title: Using the console
description: Sign in to wgkeeper console, add nodes, read the fleet summary and node pages, and use the command menu and themes.
---

import ScreenshotZoom from '@site/src/components/ScreenshotZoom';

# Using the console

How to find your way around wgkeeper console after installation. For peers and client configs, see [Peers and configs](/docs/console/managing-peers-and-configs).

## Sign in

1. Sign in as `admin` (or `BOOTSTRAP_ADMIN_USERNAME`) with the password the install script printed, or the `BOOTSTRAP_ADMIN_PASSWORD` you set.
2. Set a new password when asked. It needs at least 8 characters and can't be `admin`. Until you change it, the console refuses everything else.

Signing out or changing the password ends every session of your user, on every device.

## Add a node

You need the node's API address and API key. The node's [install script](/docs/node/installation#what-it-prints) prints both, and the key is also `auth.api_key` in the node's `config.yaml`.

1. Click **Add node** on the nodes page, the **+** next to **Fleet** in the sidebar, or pick **Add node** in the command menu.
2. Enter the **Node address**: the node API URL, `http://` or `https://`, with the port if it isn't the scheme's default. For a node installed with `--domain`, that is `https://node1.example.com`.
3. Enter the **API key**.
4. Click **Test connection** to check the node, or **Add node**, which tests it first and then saves it.

The console saves the node only if it answers with this key. It refuses a node address that is already in the console, an address with credentials (`https://user:pass@...`) and the [blocked addresses](/docs/console/security#what-the-console-does). A path after the host is dropped.

:::tip[Use an address clients can reach]

Generated client configs use the host of the node address as their **Endpoint**. Add nodes by a public hostname or IP that VPN clients can reach, not a private address only the console can use.

:::

:::warning[Plain-HTTP nodes]

The console accepts `http://` node addresses, but over an untrusted network the node API key and peer private keys then travel in the clear. Put the node behind HTTPS or reach it over a private network.

:::

## Nodes list

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-nodes-light.png"
  srcDark="/img/screenshots/wgkeeper-nodes-dark.png"
  alt="wgkeeper console nodes list with fleet summary, filters and node table"
/>

The **Nodes** page is the home screen. It shows 12 nodes per page, newest first.

| Part | What it shows |
| --- | --- |
| Summary | **Nodes**, **Online**, **Offline** and **Updates available** across the whole fleet, with a link to the latest wgkeeper node release |
| Filters | Search by address, ID or version, and show **All**, **Online**, **Offline** or **Outdated** nodes. Filters apply to the current page |
| Table | **Node** (host and short ID), **Status**, **Version** (marked when an update is available), **API** (HTTP or HTTPS) and **Added** |
| Row menu **⋯** | **Open**, **Copy address**, **Copy node ID**, **Remove node** |
| **Refresh** | Checks the status of every node |

The sidebar lists up to 100 nodes with their status under **Fleet**, so you can switch nodes from any page. Its account menu has **Profile**, **Theme** and **Sign out**.

### How status works

A node's status is the result of its last check.

| Status | When |
| --- | --- |
| Online | The node's `/readyz` answered with success within 2 seconds. The version comes from its `/stats` |
| Offline | The node didn't answer, answered with an error, or rejected the API key |

| | |
| --- | --- |
| When nodes are checked | When you add a node, and when anyone clicks **Refresh** on the nodes page or a node page, or picks **Refresh node status** in the command menu. Each refresh checks every node. The console doesn't check nodes on its own |
| How | Up to 10 nodes at a time. One refresh runs at a time; a second click joins the running one |
| Time limit | 20 seconds. A node whose check was cut off keeps its last known status |
| Update hints | The console asks GitHub for the latest wgkeeper node release, at most every 10 minutes, and waits 5 minutes after a failure. Without access to GitHub, nodes show no update hints |

If a node shows as offline, check that it is running, that the console host can reach its API address, and that the saved API key matches.

### Remove a node

Choose **Remove node** in the row's **⋯** menu or on the node page, and confirm. The console deletes the node and its stored API key. The node, its WireGuard interface and its peers keep working.

## Node page

The header shows the address, status, version, HTTP or HTTPS, the node ID, and when the node was added and last checked. When an update is available, a notice links to the release notes.

| Control | Action |
| --- | --- |
| **Refresh** | Checks the status of every node and reloads this page |
| **New config** | Opens the **Config** tab |
| **⋯** | **Copy address**, **Copy node ID**, **Release notes** (when the latest release is known), **Remove node** |

### Overview

<ScreenshotZoom
  src="/img/screenshots/wgkeeper-node-overview-light.png"
  srcDark="/img/screenshots/wgkeeper-node-overview-dark.png"
  alt="wgkeeper console node overview with peer capacity, service and WireGuard details"
/>

| Card | Fields |
| --- | --- |
| Peer capacity | Share of the node's addresses in use, with **Active now**, **Issued** and **Free**. The node counts a peer as active if it had a handshake in the last 2 minutes |
| Service | **Name**, **Version** and **Running since** of what answers on the node API |
| WireGuard | **Interface**, **Listen port**, **Address families**, **Subnets** and **Server IPs** |

### Peers and Config

- The **Peers** tab lists the node's peers; see [Peer list](/docs/console/managing-peers-and-configs#peer-list).
- The **Config** tab creates a peer and its client config; see [Generate a client config](/docs/console/managing-peers-and-configs#generate-a-client-config).

The open tab, page, filters and open peer are kept in the URL, so they survive a reload, the back button and a shared link.

## Command menu

Press `⌘K` on macOS or `Ctrl K` elsewhere, or click **Search…** at the top. Type to filter, then pick:

| Group | Items |
| --- | --- |
| Nodes | Any of the first 100 nodes, with its status |
| Actions | **Add node**, **Refresh node status**, **Go to nodes**, **Go to profile** |
| Theme | **Light**, **Dark**, **System** |
| Account | **Sign out** |

## Profile and themes

The **Profile** page has three cards:

- **Account:** the user you are signed in as.
- **Appearance:** the theme, **Light**, **Dark** or **System** (follows your operating system). It is saved in this browser.
- **Password:** change your password. This signs out every other session of your user.

## Before production use

Go through [Running it safely](/docs/console/security#running-it-safely).
