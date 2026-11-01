---
title: Reverse proxy and HTTPS
sidebar_label: Reverse proxy and HTTPS
description: Put wgkeeper console and wgkeeper node behind Caddy or nginx with HTTPS, and let only the console reach the node's API.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Reverse proxy and HTTPS

wgkeeper console and wgkeeper node both speak plain HTTP and publish their ports on `127.0.0.1` only. To reach them from other machines, put a reverse proxy with HTTPS in front of each.

The quickest way is `--domain` in the install scripts: it adds Caddy with a Let's Encrypt certificate and sets the console's proxy settings. See [console installation](/docs/console/installation) and [node installation](/docs/node/installation#install-with-the-script). Use this page to set up the proxy yourself, or to understand what the scripts set up.

## What the proxy must do

Any proxy works: Caddy, nginx, Traefik, HAProxy or a cloud load balancer, on the host or in Docker.

| Requirement | Console | Node |
| --- | --- | --- |
| Upstream from a container in the same Compose project | `console:8000` | `wireguard:51821` |
| Upstream from a proxy on the host | `127.0.0.1:8000` | `127.0.0.1:51821` |
| TLS | Terminate it, then set `COOKIE_SECURE=true` on the console | Terminate it |
| HSTS | The console sends it itself while `APP_ENV` is `production`, the default | The proxy must send it |
| `X-Forwarded-For` | Set it to the client address, overwriting any value the client sent. List the proxy in `TRUSTED_PROXIES` | Set it the same way. The node only logs it, as `forwarded_for` |
| `Host` header | Pass it through. The console checks that state-changing requests come from its own site | No requirement |
| Request time | At least 30 seconds | At least 30 seconds |
| Body size | Up to 1 MB | Up to 256 KB |
| Metrics port | Never route it through the public site | Never route it through the public site |

Never publish `8000` or `51821` on a public interface. If you change the console's `PORT` or the node's `server.port`, change the upstream and the Compose health check to match.

## Set up the proxy

Both repositories ship a proxy config and a Compose file in `examples/` that adds the proxy next to the service. For the console, that Compose file also sets `COOKIE_SECURE=true` and `TRUSTED_PROXIES=172.16.0.0/12,192.168.0.0/16,10.0.0.0/8`.

<Tabs groupId="proxy">
<TabItem value="caddy" label="Caddy" default>

Caddy gets and renews a Let's Encrypt certificate by itself while ports 80 and 443 are reachable.

1. Point the domain at the server.

2. Edit the domain in `examples/caddy/Caddyfile`.

   For the console ([`examples/caddy/`](https://github.com/wgkeeper/wgkeeper-console/tree/main/examples/caddy)):

   ```text
   console.example.com {
   	encode gzip zstd

   	# Optional: allow only your own addresses (office, VPN).
   	# @blocked not remote_ip 203.0.113.7
   	# abort @blocked

   	reverse_proxy console:8000
   }
   ```

   For the node ([`examples/caddy/`](https://github.com/wgkeeper/wgkeeper-node/tree/main/examples/caddy)):

   ```text
   api.example.com {
   	encode gzip zstd

   	# Optional: allow only your orchestrator.
   	# @blocked not remote_ip 203.0.113.7
   	# abort @blocked

   	reverse_proxy wireguard:51821
   }
   ```

   The node's example doesn't send HSTS. To send it, add `header Strict-Transport-Security "max-age=31536000"` inside the site block.

3. Start the service with the Caddy layer, from the directory with `docker-compose.yml`:

   ```bash
   docker compose -f docker-compose.yml -f examples/caddy/compose.yml up -d
   ```

</TabItem>
<TabItem value="nginx" label="nginx">

nginx doesn't get certificates itself. Both examples mount `/etc/letsencrypt` from the host and publish only `443`, leaving port 80 free for certbot.

1. Point the domain at the server and get a certificate on the host, for example with certbot. Run it from the directory with `docker-compose.yml`, so the reload hook finds the Compose files:

   ```bash
   certbot certonly --standalone -d console.example.com \
     --deploy-hook "docker compose -f $PWD/docker-compose.yml -f $PWD/examples/nginx/compose.yml exec nginx nginx -s reload"
   ```

   For the node, use its domain, for example `api.example.com`.

2. Edit `server_name` and the certificate paths in `examples/nginx/nginx.conf`.

   For the console ([`nginx.conf`](https://github.com/wgkeeper/wgkeeper-console/blob/main/examples/nginx/nginx.conf)):

   ```nginx
   server {
       listen 443 ssl;
       listen [::]:443 ssl;
       http2 on;
       server_name console.example.com;

       ssl_certificate     /etc/letsencrypt/live/console.example.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/console.example.com/privkey.pem;
       ssl_protocols       TLSv1.2 TLSv1.3;

       # Optional: allow only your own addresses (office, VPN).
       # allow 203.0.113.7;
       # deny all;

       client_max_body_size 1m;

       location / {
           proxy_pass http://console:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 35s;
           proxy_send_timeout 35s;
       }
   }
   ```

   For the node ([`nginx.conf`](https://github.com/wgkeeper/wgkeeper-node/blob/main/examples/nginx/nginx.conf)), the differences are the HSTS header, the body size and the upstream:

   ```nginx
   server {
       listen 443 ssl;
       listen [::]:443 ssl;
       http2 on;
       server_name api.example.com;

       ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
       ssl_protocols       TLSv1.2 TLSv1.3;

       add_header Strict-Transport-Security "max-age=31536000" always;

       # Optional: allow only your orchestrator.
       # allow 203.0.113.7;
       # deny all;

       client_max_body_size 256k;

       location / {
           proxy_pass http://wireguard:51821;
           proxy_set_header Host $host;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 35s;
           proxy_send_timeout 35s;
       }
   }
   ```

   Both files also have an optional `limit_req` rate limit, commented out. `http2 on` needs nginx 1.25.1 or newer.

3. Start the service with the nginx layer, from the directory with `docker-compose.yml`:

   ```bash
   docker compose -f docker-compose.yml -f examples/nginx/compose.yml up -d
   ```

</TabItem>
</Tabs>

To have plain `docker compose` commands include the proxy, put `COMPOSE_FILE=docker-compose.yml:examples/caddy/compose.yml` (or the nginx file) in `.env`. The install scripts write this line for you.

## Console settings

| Variable | Value behind a proxy |
| --- | --- |
| `COOKIE_SECURE` | `true`. Keep `false` only while you reach the console over plain HTTP, through its loopback port or an SSH tunnel |
| `TRUSTED_PROXIES` | `172.16.0.0/12,192.168.0.0/16,10.0.0.0/8` for a proxy in Docker, or your Docker network's subnet. `127.0.0.1,::1` for a proxy on the host. The address of a load balancer in front of the console |

Without `TRUSTED_PROXIES`, every request seems to come from the proxy, and the login rate limit treats all users as one client. Trust only addresses that clients can't reach directly. Details: [Console configuration](/docs/console/configuration#behind-a-reverse-proxy).

## Proxy on the host

To run Caddy or nginx on the host instead of in Docker, use the same site config with these changes:

- Upstream `127.0.0.1:8000` for the console and `127.0.0.1:51821` for the node.
- On the console, set `TRUSTED_PROXIES=127.0.0.1,::1`.
- For nginx, put the site in the `http` context, for example `/etc/nginx/conf.d/wgkeeper.conf`.

The node trusts `X-Forwarded-For` from `127.0.0.1` and `::1` for the client address in its logs. From any other address, the header is logged as is, in `forwarded_for`.

## Allow only the console

The node's API manages every peer. If wgkeeper console or your orchestrator has a fixed public address, let only that address through the node's proxy. Scanners find a new HTTPS domain within minutes of its certificate being issued.

<Tabs groupId="proxy">
<TabItem value="caddy" label="Caddy" default>

1. Uncomment these lines in the node's `examples/caddy/Caddyfile` and set the console's address. With the install script, the file is `/opt/wgkeeper/examples/caddy/Caddyfile`.

   ```text
   @blocked not remote_ip 203.0.113.7
   abort @blocked
   ```

2. Reload Caddy, from the directory with `docker-compose.yml`:

   ```bash
   docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
   ```

</TabItem>
<TabItem value="nginx" label="nginx">

1. Uncomment these lines in the node's `examples/nginx/nginx.conf` and set the console's address:

   ```nginx
   allow 203.0.113.7;
   deny all;
   ```

2. Reload nginx, from the directory with `docker-compose.yml`:

   ```bash
   docker compose exec nginx nginx -s reload
   ```

</TabItem>
</Tabs>

With nginx and certbot, you can also restrict `443` to the console's address in the host firewall. With Caddy, keep ports 80 and 443 open: Caddy gets and renews its certificate only while they are reachable.

## Connect the console to the node

Add the node in the console with its HTTPS address, for example `https://api.example.com`, and its API key. Use the exact `https://` address. The console doesn't follow redirects, so an `http://` address that the proxy redirects to HTTPS fails. See [Add a node](/docs/console/using-the-console#add-a-node).
