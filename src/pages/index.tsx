import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ScreenshotZoom from '../components/ScreenshotZoom';
import styles from './index.module.css';

const img = '/img/home/';

function Hero() {
  return (
    <header className={styles.hero}>
      <div className="container">
        <Heading as="h1" className={styles.heroTitle}>
          One panel for every WireGuard server.
        </Heading>
        <p className={styles.heroSub}>
          Install wgkeeper console once, add wgkeeper node to each server, and hand out client configs in a click.
          Self-hosted and open source.
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary" to="/docs/quick-start">
            Set up wgkeeper
          </Link>
          <Link className="button button--secondary" href="https://github.com/wgkeeper/wgkeeper">
            View on GitHub
          </Link>
          <Link className={styles.release} to="/docs/upgrading">
            What’s new in 2.0
          </Link>
        </div>
        <div className={clsx(styles.shot, styles.heroShot)}>
          <ScreenshotZoom
            src={`${img}nodes-light.webp`}
            srcDark={`${img}nodes-dark.webp`}
            alt="wgkeeper console listing every server with its status and version"
            eager
          />
        </div>
      </div>
    </header>
  );
}

function Showcase() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.h2}>
          Every server and every peer, at a glance.
        </Heading>
        <div className={styles.pair}>
          <figure className={styles.pairItem}>
            <div className={styles.shot}>
              <ScreenshotZoom
                src={`${img}peers-light.webp`}
                srcDark={`${img}peers-dark.webp`}
                alt="Peers on a server with their addresses, status and last handshake"
              />
            </div>
            <figcaption>Peers on each server, with their status and last handshake.</figcaption>
          </figure>
          <figure className={styles.pairItem}>
            <div className={styles.shot}>
              <ScreenshotZoom
                src={`${img}config-light.webp`}
                srcDark={`${img}config-dark.webp`}
                alt="A generated WireGuard client config, ready to download"
              />
            </div>
            <figcaption>A client config, ready to import.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className={styles.section}>
      <div className={clsx('container', styles.split)}>
        <div>
          <Heading as="h2" className={styles.h2}>
            The VPN doesn’t depend on the panel.
          </Heading>
          <p className={styles.lede}>
            Peers live on your servers. If the console goes down for an update, devices keep connecting.
          </p>
          <Link className={styles.textLink} to="/docs">
            How the pieces fit
          </Link>
        </div>
        <figure
          className={styles.diagram}
          aria-label="wgkeeper console controls a node on each server. Devices connect to the servers directly.">
          <div className={clsx(styles.dBox, styles.dPanel)}>
            <span className={styles.dTitle}>wgkeeper console</span>
            <span className={styles.dSub}>the panel</span>
          </div>
          <div className={styles.dFan} aria-hidden="true" />
          <div className={styles.dNodes}>
            {['Frankfurt', 'Amsterdam', 'Tokyo'].map((name) => (
              <div className={styles.dBox} key={name}>
                <span className={styles.dTitle}>
                  <span className={styles.dDot} aria-hidden="true" />
                  {name}
                </span>
                <span className={styles.dSub}>wgkeeper node</span>
              </div>
            ))}
          </div>
          <p className={styles.dClients}>Devices connect to the servers directly.</p>
        </figure>
      </div>
    </section>
  );
}

const safeguards = [
  {
    title: 'Peers are isolated',
    text: 'Devices can’t reach each other, the server or your private networks unless you allow it.',
  },
  {
    title: 'Keys stay yours',
    text: 'Node API keys are encrypted at rest. A device’s private key is shown once and never stored.',
  },
  {
    title: 'Updates in one command',
    text: 'Run the install script again. Config, keys and peers stay where they are.',
  },
];

function Safeguards() {
  return (
    <section className={styles.section}>
      <div className={clsx('container', styles.split, styles.splitTop)}>
        <Heading as="h2" className={styles.h2}>
          Safe defaults, little to maintain.
        </Heading>
        <dl className={styles.list}>
          {safeguards.map((item) => (
            <div className={styles.listItem} key={item.title}>
              <dt>{item.title}</dt>
              <dd>{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const guides = [
  {to: '/docs/quick-start', title: 'Quick start', text: 'The console, your first server and a connected device.'},
  {to: '/docs/console/installation', title: 'Console', text: 'Install, configure and use the panel.'},
  {to: '/docs/node/installation', title: 'Node', text: 'Install and configure the service on each server.'},
  {to: '/docs/guides/troubleshooting', title: 'Troubleshooting', text: 'Common errors and how to fix them.'},
];

function Start() {
  return (
    <section className={styles.section}>
      <div className={clsx('container', styles.split)}>
        <div>
          <Heading as="h2" className={styles.h2}>
            Set up your first server today.
          </Heading>
          <div className={styles.actions}>
            <Link className="button button--primary" to="/docs/quick-start">
              Set up wgkeeper
            </Link>
          </div>
        </div>
        <nav className={styles.guides} aria-label="Documentation">
          {guides.map((guide) => (
            <Link key={guide.to} to={guide.to} className={styles.guide}>
              <span className={styles.guideTitle}>{guide.title}</span>
              <span className={styles.guideText}>{guide.text}</span>
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="One panel for every WireGuard server"
      description="wgkeeper is a self-hosted, open-source WireGuard panel: install wgkeeper console once, add wgkeeper node to each server and hand out client configs in a click.">
      <Hero />
      <main>
        <Showcase />
        <Architecture />
        <Safeguards />
        <Start />
      </main>
    </Layout>
  );
}
