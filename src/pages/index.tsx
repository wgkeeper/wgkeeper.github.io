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
  },
  {
    title: 'Peer management',
    description: 'Create peers, inspect connection state, and verify handshakes after clients connect.',
  },
  {
    title: 'Config generation',
    description: 'Generate WireGuard client configs after assigning peers to the right node.',
  },
  {
    title: 'Metrics & monitoring',
    description: 'Optional Prometheus endpoint per node, with a ready-made Grafana dashboard.',
  },
];

const steps = [
  {
    title: 'Install the Console',
    description: 'Spin up the central control plane with Docker Compose.',
    to: '/docs/console/installation',
  },
  {
    title: 'Connect a Node',
    description: 'Run the Node service and link it from the Console with its API endpoint and key.',
    to: '/docs/node/installation',
  },
  {
    title: 'Create peers',
    description: 'Allocate IPs, generate WireGuard client configs, and monitor handshakes.',
    to: '/docs/console/managing-peers-and-configs',
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
            An open-source system for managing WireGuard®
            infrastructure at scale — a central Console for orchestration
            paired with Node services running on each server.
          </p>
          <div className={styles.buttons}>
            <Link className={clsx('button button--lg', styles.primaryButton)} to="/docs/quick-start">
              Quick start
            </Link>
            <Link
              className={clsx('button button--lg', styles.ghostButton)}
              to="https://github.com/wgkeeper/wgkeeper">
              <span className={styles.ghButtonIcon} aria-hidden="true">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </span>
              GitHub
            </Link>
          </div>
          <p className={styles.trustRow}>
            <span>AGPL-3.0</span>
            <span aria-hidden="true">·</span>
            <span>Self-hosted</span>
            <span aria-hidden="true">·</span>
            <span>Docker-ready</span>
          </p>
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
      <div className="container">
        <div className={styles.docsPathHeader}>
          <p className={styles.eyebrow}>Start operating</p>
          <Heading as="h2" className={styles.sectionTitle}>
            Follow the deployment path
          </Heading>
          <p className={styles.sectionText}>
            Three steps to a working setup. Each step links to the detailed guide.
          </p>
        </div>
        <ol className={styles.stepsGrid}>
          {steps.map((step, idx) => (
            <li className={styles.stepCard} key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <Heading as="h3" className={styles.stepTitle}>
                {step.title}
              </Heading>
              <p className={styles.stepText}>{step.description}</p>
              <Link className={styles.stepLink} to={step.to}>
                Read the guide
              </Link>
            </li>
          ))}
        </ol>
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
