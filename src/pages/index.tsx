import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ScreenshotZoom from '../components/ScreenshotZoom';
import styles from './index.module.css';

const screenshotPath = '/img/screenshots/';

const features = [
  {
    title: 'Node health and capacity',
    description: 'Track node status, version, peer capacity, and health from one Console view.',
    to: '/docs/console/using-the-console',
  },
  {
    title: 'Peer management',
    description: 'Create peers, inspect connection state, and verify handshakes after clients connect.',
    to: '/docs/console/managing-peers-and-configs',
  },
  {
    title: 'Config generation',
    description: 'Generate WireGuard client configs after assigning peers to the right node.',
    to: '/docs/console/managing-peers-and-configs#generate-client-config',
  },
];

function HomepageHeader() {
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className={clsx('container', styles.heroGrid)}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>WGKeeper Documentation</p>
          <Heading as="h1" className={styles.heroTitle}>
            Centralized management for VPN infrastructure
          </Heading>
          <p className={styles.heroText}>
            WGKeeper is an open-source system for managing WireGuard®
            infrastructure at scale.
          </p>
          <p className={styles.heroNote}>
            It consists of a central Console for orchestration and Node
            services that run on the servers themselves.
          </p>
          <div className={styles.buttons}>
            <Link className={clsx('button button--lg', styles.primaryButton)} to="/docs">
              Open Documentation
            </Link>
          </div>
        </div>
        <div className={styles.heroScreenshot}>
          <ScreenshotZoom
            src={`${screenshotPath}wgkeeper-nodes-light.png`}
            alt="WGKeeper Console showing nodes, status, versions, and updates"
          />
        </div>
      </div>
    </header>
  );
}

function FeatureCards() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            What you can manage
          </Heading>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.title}>
              <Heading as="h3" className={styles.featureTitle}>
                {feature.title}
              </Heading>
              <p className={styles.featureText}>{feature.description}</p>
              <Link className={styles.featureLink} to={feature.to}>
                Read more
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DocsPath() {
  return (
    <section className={styles.docsPathSection}>
      <div className={clsx('container', styles.docsPathGrid)}>
        <div>
          <p className={styles.eyebrow}>Start operating</p>
          <Heading as="h2" className={styles.sectionTitle}>
            Follow the deployment path
          </Heading>
          <p className={styles.sectionText}>
            Install the Console, connect a Node, then create peers and generate client configs.
          </p>
        </div>
        <Link className={clsx('button button--lg', styles.secondaryButton)} to="/docs/console/installation">
          Start with Console Installation
        </Link>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="WGKeeper documentation for the Console and Node components.">
      <HomepageHeader />
      <main>
        <FeatureCards />
        <DocsPath />
      </main>
    </Layout>
  );
}
