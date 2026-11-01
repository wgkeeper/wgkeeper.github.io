---
title: Database and backups
description: Where wgkeeper console keeps its data, how to switch from SQLite to PostgreSQL, and how to back up and restore both together with SECRET_KEY.
---

# Database and backups

wgkeeper console keeps users and nodes in a database: SQLite by default, or PostgreSQL. Peers are not in it; they live on the nodes. The console creates and updates its tables on every start.

## What the database holds

| Table | Contents | Protection |
| --- | --- | --- |
| `users` | Username, password hash, admin flag, whether the password must be changed | Passwords hashed with bcrypt |
| `nodes` | Node address, API key, last known status and version | API key encrypted with a key derived from `SECRET_KEY` |

Back up the database and `SECRET_KEY` together: one is useless without the other.

## SQLite

SQLite is the default and needs no setup.

| | |
| --- | --- |
| File in the container | `/app/data/wgkeeper-console.db`, set by `DATABASE_URL=file:/app/data/wgkeeper-console.db` in the image |
| Volume | `console_data`, mounted at `/app/data`. The full name starts with the Compose project name; `docker volume ls` shows it |
| Connections | One |

Outside Docker, the default is `file:./wgkeeper-console.db`, relative to the working directory. The console creates the parent directory with mode `0750` if it's missing.

## Switch to PostgreSQL

Switching doesn't move data. The console starts with an empty database, creates the first user from `BOOTSTRAP_ADMIN_USERNAME` and `BOOTSTRAP_ADMIN_PASSWORD` again, and you add the nodes again.

[`examples/postgres/compose.yml`](https://github.com/wgkeeper/wgkeeper-console/blob/main/examples/postgres/compose.yml) runs `postgres:18-alpine` next to the console, keeps its data in the `postgres_data` volume and sets `DATABASE_URL` for the console. Check first that `BOOTSTRAP_ADMIN_PASSWORD` is still set in `console.env`; the install script leaves it there.

### Installed with the script

The install script doesn't download the PostgreSQL example and rewrites `COMPOSE_FILE` in `.env` on every run. Use it as your override file, which the script keeps and includes:

1. Download the example as `docker-compose.override.yml`. If you already have an override file, merge the two instead:

   ```bash
   cd /opt/wgkeeper-console
   curl -fsSL -o docker-compose.override.yml \
     https://raw.githubusercontent.com/wgkeeper/wgkeeper-console/v2.0.0/examples/postgres/compose.yml
   ```

2. Put a database password in `.env`:

   ```bash
   echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env
   ```

3. Add `:docker-compose.override.yml` to the end of the `COMPOSE_FILE` line in `.env`, then start:

   ```bash
   docker compose up -d
   ```

4. Sign in, change the bootstrap password and add the nodes again.

### Installed with Docker Compose

1. From the repository directory, put a database password in `.env`:

   ```bash
   echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" >> .env
   ```

2. Start the console with the PostgreSQL layer:

   ```bash
   docker compose -f docker-compose.yml -f examples/postgres/compose.yml up -d
   ```

3. Sign in, change the bootstrap password and add the nodes again.

To keep a proxy layer, list every file, or put them all in `COMPOSE_FILE` in `.env` so plain `docker compose` picks them up:

```ini
COMPOSE_FILE=docker-compose.yml:examples/caddy/compose.yml:examples/postgres/compose.yml
```

### Existing PostgreSQL server

Set the URL in `console.env`:

```ini
DATABASE_URL=postgres://user:password@db.example.com:5432/console?sslmode=require
```

The pool settings `DB_MAX_OPEN_CONNS`, `DB_MAX_IDLE_CONNS`, `DB_CONN_MAX_LIFETIME` and `DB_CONN_MAX_IDLE_TIME` are in [Configuration](/docs/console/configuration#database).

## What to keep with a backup

| Item | Where | Why |
| --- | --- | --- |
| Database | `console_data` volume, or your PostgreSQL database | Users and nodes |
| `console.env` | Next to `docker-compose.yml` | `SECRET_KEY` decrypts the node API keys in the database; `BOOTSTRAP_ADMIN_PASSWORD` is needed if you ever start on an empty database |
| `.env` | Next to `docker-compose.yml` | `POSTGRES_PASSWORD` and `COMPOSE_FILE`, if you use them |
| Your edits | `examples/caddy/Caddyfile`, `docker-compose.override.yml` | Your domain, allowlist and Compose changes |

Caddy gets a new certificate by itself, so its volumes don't need a backup.

:::danger[Keep the same SECRET_KEY]

A restored database with a different `SECRET_KEY` starts and lets you sign in, but the console can't decrypt the node API keys and the node list fails to load. Restore the original key to fix it.

:::

## Back up and restore SQLite

Run these from the directory with `docker-compose.yml`, for example `/opt/wgkeeper-console`.

To back up, stop the console, archive the volume and start it again:

```bash
docker compose stop console
docker run --rm --volumes-from "$(docker compose ps -aq console)" -v "$PWD":/backup alpine \
  tar czf "/backup/console-data-$(date +%F).tgz" -C /app/data .
docker compose start console
```

Copy `console.env` next to the archive.

To back up without stopping, use the `sqlite3` tool in the image:

```bash
docker compose exec console sqlite3 /app/data/wgkeeper-console.db ".backup /app/data/backup.db"
docker compose cp console:/app/data/backup.db "./console-$(date +%F).db"
docker compose exec console rm /app/data/backup.db
```

To restore an archive:

1. Put the original `SECRET_KEY` in `console.env`.
2. Stop the console and unpack the archive into the volume:

   ```bash
   docker compose stop console
   docker run --rm --volumes-from "$(docker compose ps -aq console)" -v "$PWD":/backup alpine \
     tar xzf /backup/console-data-2026-11-01.tgz -C /app/data
   docker compose start console
   ```

## Back up and restore PostgreSQL

These commands use the `postgres` service from the example. For another server, run `pg_dump` and `psql` against it the same way.

To back up:

```bash
docker compose exec -T postgres pg_dump -U console console > "console-$(date +%F).sql"
```

Copy `console.env` and `.env` next to the dump.

To restore into a fresh database:

1. Put the original `SECRET_KEY` in `console.env`.
2. Stop the console, recreate the database and load the dump:

   ```bash
   docker compose stop console
   docker compose exec -T postgres dropdb -U console console
   docker compose exec -T postgres createdb -U console console
   docker compose exec -T postgres psql -U console -d console < console-2026-11-01.sql
   docker compose start console
   ```

## If the console is lost

The VPN keeps working without the console, because peers live on the nodes. Without a backup, install a fresh console and add the nodes again with their API keys. If the database may have leaked, see [If the console is lost or compromised](/docs/console/security#if-the-console-is-lost-or-compromised).
