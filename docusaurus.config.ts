import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'WGKeeper Docs',
  tagline: 'Open-source WireGuard® server management system',
  future: {
    v4: true,
  },
  url: 'https://wgkeeper.github.io',
  baseUrl: '/',
  organizationName: 'wgkeeper',
  projectName: 'wgkeeper.github.io',
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/docs',
          editUrl: 'https://github.com/wgkeeper/wgkeeper.github.io/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'WGKeeper Docs',
      items: [
        {
          to: '/docs',
          label: 'Documentation',
          position: 'left',
        },
        {
          href: 'https://github.com/wgkeeper/wgkeeper',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} WGKeeper. WireGuard® is a registered trademark of Jason A. Donenfeld.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
