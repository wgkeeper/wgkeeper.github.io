import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'quick-start',
    {
      type: 'category',
      label: 'Console',
      collapsed: false,
      items: [
        'console/installation',
        'console/configuration',
        'console/database-and-backups',
        'console/using-the-console',
        'console/managing-peers-and-configs',
        'console/metrics-and-logs',
        'console/security',
      ],
    },
    {
      type: 'category',
      label: 'Node',
      collapsed: false,
      items: ['node/installation', 'node/configuration', 'node/api', 'node/metrics', 'node/security'],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: ['guides/reverse-proxy', 'guides/troubleshooting', 'upgrading'],
    },
  ],
};

export default sidebars;
