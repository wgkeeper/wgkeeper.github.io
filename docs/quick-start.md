---
title: Quick start
description: Install wgkeeper console and your first wgkeeper node with the install scripts, then connect a device.
---

# Quick start

This tutorial takes you from two empty Linux servers to a connected WireGuard device, using the install scripts with their defaults.

## Before you start

| Server | Needs |
| --- | --- |
| Panel | Linux, root access, a DNS name such as `console.example.com`, ports `80/tcp` and `443/tcp` open |
| WireGuard server | Linux with WireGuard in the kernel (built in since 5.6), root access, a public IP, a DNS name such as `node1.example.com`, ports `51820/udp`, `80/tcp` and `443/tcp` open |

The scripts install Docker if it is missing. If `ufw` is active, they open the ports themselves; open them in any cloud firewall yourself.

## 1. Install the console

On the panel server, run:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-console/main/scripts/install.sh | sudo bash -s -- --domain console.example.com
```

You should see the address and a random admin password:

```text
  Address:  https://console.example.com
  Login:    admin / <24 hex characters>  (you'll be asked to change it)
```

:::warning[Back up console.env]

`/opt/wgkeeper-console/console.env` holds `SECRET_KEY`, which encrypts the stored node API keys. Back it up with the database. See [Database and backups](/docs/console/database-and-backups).

:::

Without `--domain`, see [Console installation](/docs/console/installation) for access through an SSH tunnel.

## 2. Sign in

Open the address, sign in as `admin` with the printed password, and set a new password of at least 8 characters.

You should see the **Nodes** page with no nodes.

## 3. Install the node

On the WireGuard server, run:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-node/main/scripts/install.sh | sudo bash -s -- --domain node1.example.com
```

You should see the API address and a new API key:

```text
  API address:  https://node1.example.com
  API key:      <64 hex characters>
  WireGuard:    51820/udp
```

The `--domain` option puts Caddy with HTTPS in front of the API. Without it, the API listens on `127.0.0.1` only and the console cannot reach it. Other options: [Node installation](/docs/node/installation).

## 4. Add the node to the console

In the console, click **Add node**. Paste the API address into **Node address** and the key into **API key**, then click **Add node**.

The console tests the connection first. You should see the node in the list as **Online** with its version. If the dialog shows an error, see [Troubleshooting](/docs/guides/troubleshooting).

## 5. Generate a client config

1. Open the node and click **New config**.
2. Keep the generated **Peer ID**. **Expires**, **Address families** and **DNS servers** are optional.
3. Click **Generate config**, then **Download**.

You should get a file named like `wgkeeper-1b5a0c1c.conf`.

:::danger[The private key is shown once]

Neither the console nor the node keeps the peer's private key. Download or copy the config before you leave the page.

:::

## 6. Connect a device

Import the `.conf` file into the WireGuard app and turn the tunnel on. On Linux with `wg-quick`:

```bash
sudo install -m 600 wgkeeper-1b5a0c1c.conf /etc/wireguard/wgk0.conf
sudo wg-quick up wgk0
```

In the console, open the node's **Peers** tab. You should see the peer as **Active** with a recent **Last handshake**. If it stays at **Never**, see [Troubleshooting](/docs/guides/troubleshooting).

## Next steps

- Add more servers: repeat steps 3 and 4 on each one.
- [Peers and configs](/docs/console/managing-peers-and-configs): expiry, key rotation, deleting peers.
- [Node configuration](/docs/node/configuration): IPv6, the WAN interface, access to private networks.
- [Console security](/docs/console/security) and [node security](/docs/node/security): what to lock down.
- Updates: run the same install command again on each server.
