---
title: Installation
description: Install wgkeeper console with the install script or Docker Compose, update it, or build it from source.
---

# Console installation

wgkeeper console is one container that serves the web interface and its API on one HTTP port, with SQLite as the default database.

## Requirements

| | Requirement |
| --- | --- |
| Host | Docker with Docker Compose v2. The published image is built for `linux/amd64` only. The install script runs on Linux only |
| Database | SQLite (default, a file in the data volume) or PostgreSQL |
| Nodes | [wgkeeper node](/docs/node/installation) 2.0.0 or newer, reachable from the console over HTTP or HTTPS |

## Install with the script

Run this on a Linux server:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-console/main/scripts/install.sh | sudo bash
```

Without `--domain`, the console listens on `127.0.0.1:8000` only. Open it through an SSH tunnel, then go to `http://127.0.0.1:8000`:

```bash
ssh -L 8000:127.0.0.1:8000 your-server
```

For HTTPS, point a domain at the server and pass `--domain`. The script puts Caddy with a Let's Encrypt certificate in front of the console:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-console/main/scripts/install.sh | sudo bash -s -- --domain console.example.com
```

:::tip[Read the script first]

The script runs as root. To review it first, download it, read it, then run the local copy:

```bash
curl -fsSL -o install.sh https://raw.githubusercontent.com/wgkeeper/wgkeeper-console/main/scripts/install.sh
less install.sh
sudo bash install.sh --domain console.example.com
```

:::

### Options

Pass options after `bash -s --` when piping, or directly after `install.sh` when running a local copy.

| Option | Default | Description |
| --- | --- | --- |
| `--version X.Y.Z` | latest stable release | Release to install, for example `2.0.0`. A leading `v` is accepted. The script supports 2.0.0 and newer |
| `--domain NAME` | none | Add Caddy with a Let's Encrypt certificate for this domain. It must point at the server, with ports 80 and 443 reachable. Applied only on the first run with Caddy; later, edit `examples/caddy/Caddyfile` |
| `--dir PATH` | `/opt/wgkeeper-console` | Install directory |
| `-h`, `--help` | | Print the options and exit |

### What the script does

1. Checks for Linux, root and `curl`. Installs Docker with `get.docker.com` if it's missing, and stops if Docker Compose v2 is missing.
2. Downloads `docker-compose.yml` of the release and pins the image to `ghcr.io/wgkeeper/console:X.Y.Z`.
3. If `console.env` doesn't exist, writes it, readable by root only, with a random `SECRET_KEY`, a random `BOOTSTRAP_ADMIN_PASSWORD` and `COOKIE_SECURE=false`. An existing `console.env` is kept.
4. With `--domain`, or when Caddy is already installed, adds the Caddy layer, which sets `COOKIE_SECURE=true` and `TRUSTED_PROXIES`. If ufw is active, opens `80/tcp` and `443/tcp`.
5. Writes `COMPOSE_FILE` to `.env`, pulls the image and runs `docker compose up -d --remove-orphans`.
6. Waits up to about 60 seconds for `http://127.0.0.1:8000/readyz` and prints the result.

### What it prints

```text
wgkeeper console 2.0.0 is running in /opt/wgkeeper-console.

  Address:  https://console.example.com
  Login:    admin / <24 hex characters>  (you'll be asked to change it)

Settings and the secret key are in /opt/wgkeeper-console/console.env; back it up with the database.
Manage it with: cd /opt/wgkeeper-console && docker compose ps | logs | down
```

Without `--domain`, **Address** is `http://127.0.0.1:8000`. If `console.env` already existed, **Login** says `unchanged`. Then [sign in](/docs/console/using-the-console#sign-in).

If the console doesn't become ready, the script stops with an error. Read the logs:

```bash
cd /opt/wgkeeper-console && docker compose logs console
```

### Where the files are

| Path in `/opt/wgkeeper-console` | Contents | Replaced on update |
| --- | --- | --- |
| `console.env` | Settings, `SECRET_KEY`, bootstrap admin password | Never |
| `console_data` volume | SQLite database: users, nodes, encrypted node API keys | Never |
| `docker-compose.yml` | Compose file of the installed release | Yes |
| `examples/caddy/compose.yml` | Caddy service, with `--domain` | Yes |
| `examples/caddy/Caddyfile` | Caddy site with your domain, with `--domain` | Never, once it exists |
| `caddy_data`, `caddy_config` volumes | Caddy certificates and state, with `--domain` | Never |
| `docker-compose.override.yml` | Your own Compose changes, if you create it | Never |
| `.env` | `COMPOSE_FILE`, so plain `docker compose` here includes Caddy and your override file; your own variables | Only the `COMPOSE_FILE` line |

### Allow only your addresses

With a fixed office or VPN address, uncomment these lines in `examples/caddy/Caddyfile` and set your address:

```caddyfile
# @blocked not remote_ip 203.0.113.7
# abort @blocked
```

Then reload Caddy:

```bash
cd /opt/wgkeeper-console && docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

## Update the console

Run the script again. It installs the latest stable release, or the one you pass with `--version`:

```bash
curl -fsSL https://raw.githubusercontent.com/wgkeeper/wgkeeper-console/main/scripts/install.sh | sudo bash -s -- --version 2.0.1
```

It keeps `console.env`, the database, the Caddyfile and your override file, and replaces the Compose files. The console runs database migrations on start. An installed Caddy layer stays without `--domain`.

Coming from 1.x, see [Upgrading to 2.0](/docs/upgrading#upgrade-the-console).

## Install with Docker Compose

Use this on hosts the script doesn't support, or to manage the files yourself. [`docker-compose.yml`](https://github.com/wgkeeper/wgkeeper-console/blob/main/docker-compose.yml) reads settings from `console.env`, keeps the database in the `console_data` volume and publishes the port on `127.0.0.1:8000` only. It also sets `no-new-privileges`, checks `/readyz` and rotates container logs (three files of 10 MB).

1. Get the files and create `console.env`:

   ```bash
   git clone https://github.com/wgkeeper/wgkeeper-console.git
   cd wgkeeper-console
   cp console.env.example console.env
   chmod 600 console.env
   ```

2. Set the required variables in `console.env`. Generate `SECRET_KEY` with `openssl rand -hex 32`:

   ```ini
   SECRET_KEY=<64 hex characters>
   BOOTSTRAP_ADMIN_PASSWORD=<initial admin password>
   COOKIE_SECURE=false
   ```

   Keep `COOKIE_SECURE=false` while you use plain HTTP (the loopback port or an SSH tunnel). All variables are in [Configuration](/docs/console/configuration).

3. Start it:

   ```bash
   docker compose up -d
   ```

Back up `SECRET_KEY` with the database; see [Database and backups](/docs/console/database-and-backups).

### Image tags

The Compose file uses the image without a tag, which means `latest`. Pin a release in `docker-compose.override.yml`:

```yaml
services:
  console:
    image: ghcr.io/wgkeeper/console:2.0.0
```

| Tag | Points to |
| --- | --- |
| `X.Y.Z` | That release |
| `latest` | The newest stable release |
| `edge` | The latest build from `main` |
| `sha-<commit>` | A build of that `main` commit |

### HTTPS

The console speaks plain HTTP. For access from other machines, see [Reverse proxy](/docs/guides/reverse-proxy).

## From source

For the toolchain, see [Deployment](https://github.com/wgkeeper/wgkeeper-console/blob/main/docs/deployment.md#from-source) in the console repository. To build the image yourself:

```bash
docker build -t ghcr.io/wgkeeper/console:local .
```

Then set `image: ghcr.io/wgkeeper/console:local` in `docker-compose.override.yml`.

## Next steps

- [Using the console](/docs/console/using-the-console): sign in, add your nodes, find your way around.
- [Configuration](/docs/console/configuration): every environment variable.
- [Database and backups](/docs/console/database-and-backups): PostgreSQL, backup and restore.
- [Security](/docs/console/security): running the console safely.
