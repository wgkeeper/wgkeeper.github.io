import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const screenshotPath = '/img/screenshots/';

const features = [
  {
    title: 'Node health and capacity',
    image: `${screenshotPath}wgkeeper-node-overview-light.png`,
    alt: 'WGKeeper node overview with health and capacity metrics',
  },
  {
    title: 'Peer management',
    image: `${screenshotPath}wgkeeper-node-peers-light.png`,
    alt: 'WGKeeper peer management screen',
  },
  {
    title: 'Config generation',
    image: `${screenshotPath}wgkeeper-config-generator-light.png`,
    alt: 'WGKeeper WireGuard config generator',
  },
];

function ScreenshotLink({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <a className={styles.screenshotLink} href={src} target="_blank" rel="noreferrer">
      <img src={src} alt={alt} />
    </a>
  );
}

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
          <ScreenshotLink
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
              <ScreenshotLink src={feature.image} alt={feature.alt} />
              <Heading as="h3" className={styles.featureTitle}>
                {feature.title}
              </Heading>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailSection() {
  return (
    <section className={styles.detailSection}>
      <div className={clsx('container', styles.detailGrid)}>
        <div>
          <p className={styles.eyebrow}>Peer details</p>
          <Heading as="h2" className={styles.sectionTitle}>
            Drill into each connection
          </Heading>
          <p className={styles.sectionText}>
            Inspect peer state, endpoint data, transfer totals, and generated configuration in one place.
          </p>
        </div>
        <div className={styles.detailScreenshot}>
          <ScreenshotLink
            src={`${screenshotPath}wgkeeper-peer-details-light.png`}
            alt="WGKeeper peer details drawer"
          />
        </div>
      </div>
    </section>
  );
}

function DarkModeSection() {
  return (
    <section className={styles.section}>
      <div className={clsx('container', styles.darkModeGrid)}>
        <div>
          <p className={styles.eyebrow}>Dark mode included</p>
          <Heading as="h2" className={styles.sectionTitle}>
            Manage nodes in a darker workspace
          </Heading>
        </div>
        <div className={styles.darkScreenshot}>
          <ScreenshotLink
            src={`${screenshotPath}wgkeeper-nodes-dark.png`}
            alt="WGKeeper Console nodes screen in dark mode"
          />
        </div>
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
        <DetailSection />
        <DarkModeSection />
      </main>
    </Layout>
  );
}
