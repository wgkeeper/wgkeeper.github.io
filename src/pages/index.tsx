import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();

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
        <div className={styles.heroPanel}>
          <div className={styles.panelCard}>
            <p className={styles.panelLabel}>Built for</p>
            <Heading as="h2" className={styles.panelTitle}>
              Multi-node deployments
            </Heading>
            <ul className={styles.panelList}>
              <li>Centralized orchestration</li>
              <li>Many servers and many nodes</li>
              <li>Node docs available now</li>
            </ul>
            <p className={styles.panelMuted}>Console documentation will be added later.</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout
      title={siteConfig.title}
      description="WGKeeper documentation for the Console and Node components.">
      <HomepageHeader />
      <main />
    </Layout>
  );
}
