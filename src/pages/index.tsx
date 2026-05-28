import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import ScreenshotZoom from '../components/ScreenshotZoom';
import styles from './index.module.css';

const screenshotPath = '/img/screenshots/';

const capabilities = [
  {
    key: 'nodes',
    title: 'Node health and capacity',
    description:
      'Track status, version, peer capacity, and health for every node from one Console view.',
  },
  {
    key: 'peers',
    title: 'Peer management',
    description:
      'Create peers, inspect connection state, and verify handshakes after clients connect.',
  },
  {
    key: 'configs',
    title: 'Config generation',
    description:
      'Generate wg-quick client configs once a peer is assigned to the right node.',
  },
  {
    key: 'metrics',
    title: 'Metrics and monitoring',
    description:
      'Optional Prometheus endpoint per node, with a ready-made Grafana dashboard.',
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
    <header className={clsx('hero', styles.hero)}>
      <div className={clsx('container', styles.heroGrid)}>
        <div className={styles.heroCopy}>
          <p className={styles.meta}>
            <span className={styles.statusDot} aria-hidden="true" />
            open-source wireguard control plane
          </p>
          <Heading as="h1" className={styles.heroTitle}>
            Centralized control for your WireGuard fleet
          </Heading>
          <p className={styles.heroText}>
            A web Console plus a per-server Node service that replace hand-edited{' '}
            <code>wg0.conf</code> files with API-driven peer management. Manage nodes,
            generate client configs, and verify handshakes from one place.
          </p>
          <div className={styles.actions}>
            <Link
              className={clsx('button button--lg button--primary', styles.primaryButton)}
              to="/docs/quick-start">
              Quick start
            </Link>
            <Link
              className={clsx('button button--lg', styles.ghostButton)}
              to="https://github.com/wgkeeper/wgkeeper">
              <span className={styles.ghIcon} aria-hidden="true">
                <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </span>
              GitHub
            </Link>
          </div>
          <ul className={styles.specs}>
            <li>AGPL-3.0</li>
            <li>Self-hosted</li>
            <li>Docker-ready</li>
          </ul>
        </div>

        <div className={styles.heroMedia}>
          <div className={styles.frame}>
            <div className={styles.frameBar} aria-hidden="true">
              <span className={styles.frameDots}>
                <i />
                <i />
                <i />
              </span>
              <span className={styles.framePath}>wgkeeper-console / nodes</span>
            </div>
            <ScreenshotZoom
              src={`${screenshotPath}wgkeeper-nodes-light.png`}
              srcDark={`${screenshotPath}wgkeeper-nodes-dark.png`}
              alt="WGKeeper Console showing nodes, status, versions, and updates"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function Capabilities() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          What you can manage
        </Heading>
        <div className={styles.matrix}>
          {capabilities.map((item) => (
            <article className={styles.cell} key={item.key}>
              <span className={styles.cellKey}>{item.key}</span>
              <Heading as="h3" className={styles.cellTitle}>
                {item.title}
              </Heading>
              <p className={styles.cellText}>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className={styles.archSection}>
      <div className={clsx('container', styles.archGrid)}>
        <div className={styles.archCopy}>
          <Heading as="h2" className={styles.sectionTitle}>
            Two services, one source of truth
          </Heading>
          <p className={styles.sectionText}>
            The Console is the control plane you log into: it holds the inventory of
            nodes and peers. A Node runs on each WireGuard server, owns the local
            interface, and exposes a REST API the Console calls. One Console manages
            many Nodes.
          </p>
          <Link className={styles.textLink} to="/docs/">
            Read the architecture overview
          </Link>
        </div>

        <figure
          className={styles.topo}
          role="img"
          aria-label="Operator connects to one Console over HTTPS; the Console manages three Nodes over a REST API.">
          <div className={clsx(styles.topoNode, styles.topoOperator)}>
            <span className={styles.topoLabel}>Operator</span>
            <span className={styles.topoSub}>Web UI</span>
          </div>
          <span className={styles.wire} aria-hidden="true" />
          <div className={clsx(styles.topoNode, styles.topoConsole)}>
            <span className={styles.topoLabel}>Console</span>
            <span className={styles.topoSub}>inventory · auth · audit</span>
          </div>
          <span className={styles.wire} aria-hidden="true" />
          <div className={styles.topoNodes}>
            {['fra-04', 'sfo-03', 'lon-06'].map((node) => (
              <div className={clsx(styles.topoNode, styles.topoLeaf)} key={node}>
                <span className={styles.topoLeafHead}>
                  <span className={styles.statusDot} aria-hidden="true" />
                  Node
                </span>
                <span className={styles.topoSub}>{node}</span>
              </div>
            ))}
          </div>
        </figure>
      </div>
    </section>
  );
}

function DeploymentSteps() {
  return (
    <section className={styles.stepsSection}>
      <div className="container">
        <div className={styles.stepsHeader}>
          <Heading as="h2" className={styles.sectionTitle}>
            Follow the deployment path
          </Heading>
          <p className={styles.sectionText}>
            Three steps to a working setup. Each one links to the detailed guide.
          </p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, idx) => (
            <li className={styles.step} key={step.title}>
              <span className={styles.stepNum}>{String(idx + 1).padStart(2, '0')}</span>
              <Heading as="h3" className={styles.stepTitle}>
                {step.title}
              </Heading>
              <p className={styles.stepText}>{step.description}</p>
              <Link className={styles.textLink} to={step.to}>
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
        <Capabilities />
        <Architecture />
        <DeploymentSteps />
      </main>
    </Layout>
  );
}
