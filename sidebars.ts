import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'quick-start',
    {
      type: 'category',
      label: 'Console',
      items: ['console/installation', 'console/using-the-console', 'console/managing-peers-and-configs'],
    },
    {
      type: 'category',
      label: 'Node',
      items: ['node/installation', 'node/configuration', 'node/metrics'],
    },
  ],
};

export default sidebars;
