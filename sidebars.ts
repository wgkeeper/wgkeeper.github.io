import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Console',
      items: ['console/index'],
    },
    {
      type: 'category',
      label: 'Node',
      items: ['node/installation', 'node/configuration'],
    },
  ],
};

export default sidebars;
