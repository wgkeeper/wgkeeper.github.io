import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Console',
      items: ['console/installation', 'console/using-the-console', 'console/managing-peers-and-configs'],
    },
    {
      type: 'category',
      label: 'Node',
      items: ['node/installation', 'node/configuration'],
    },
  ],
};

export default sidebars;
