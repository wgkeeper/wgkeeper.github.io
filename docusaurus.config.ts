import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Code in dark mode stays in the site's neutral greys instead of VS Code blue.
const neutralDark: typeof prismThemes.vsDark = {
  plain: {color: '#ededed', backgroundColor: '#0d0d0d'},
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: '#878787', fontStyle: 'italic'}},
    {types: ['punctuation', 'operator'], style: {color: '#a1a1a1'}},
    {types: ['string', 'char', 'attr-value', 'url', 'inserted'], style: {color: '#c8c8c8'}},
    {types: ['number', 'boolean', 'constant', 'symbol'], style: {color: '#ededed'}},
    {types: ['keyword', 'builtin', 'function', 'tag', 'selector', 'atrule'], style: {color: '#ffffff'}},
    {types: ['property', 'attr-name', 'key', 'variable'], style: {color: '#d4d4d4'}},
    {types: ['deleted'], style: {color: '#ff5c61'}},
  ],
};

const config: Config = {
  title: 'wgkeeper',
  tagline: 'Self-hosted WireGuard® fleet management: a node service on every server and one console to run them.',
  favicon: 'img/favicon.svg',
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
  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
  ],
  stylesheets: [
    {
      href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300..800&family=Geist+Mono:wght@400..600&display=swap',
      type: 'text/css',
    },
  ],
  clientModules: ['./src/clientModules/tableLabels.ts'],
  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/docs',
          editUrl: 'https://github.com/wgkeeper/wgkeeper.github.io/tree/main/',
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    metadata: [
      {name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)'},
      {name: 'theme-color', content: '#0a0a0a', media: '(prefers-color-scheme: dark)'},
    ],
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: false,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    navbar: {
      title: 'docs',
      logo: {
        alt: 'wgkeeper',
        src: 'img/wgkeeper.svg',
        width: 94,
        height: 20,
      },
      items: [
        {to: '/docs', label: 'Introduction', position: 'left', activeBaseRegex: '^/docs/?$'},
        {to: '/docs/quick-start', label: 'Quick start', position: 'left'},
        {to: '/docs/console/installation', label: 'Console', position: 'left', activeBaseRegex: '^/docs/console/'},
        {to: '/docs/node/installation', label: 'Node', position: 'left', activeBaseRegex: '^/docs/node/'},
        {to: '/docs/guides/troubleshooting', label: 'Guides', position: 'left', activeBaseRegex: '^/docs/(guides/|upgrading)'},
        {
          href: 'https://github.com/wgkeeper/wgkeeper',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'wgkeeper on GitHub',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Introduction', to: '/docs'},
            {label: 'Quick start', to: '/docs/quick-start'},
            {label: 'Console', to: '/docs/console/installation'},
            {label: 'Node', to: '/docs/node/installation'},
            {label: 'Troubleshooting', to: '/docs/guides/troubleshooting'},
          ],
        },
        {
          title: 'Source',
          items: [
            {label: 'wgkeeper', href: 'https://github.com/wgkeeper/wgkeeper'},
            {label: 'wgkeeper node', href: 'https://github.com/wgkeeper/wgkeeper-node'},
            {label: 'wgkeeper console', href: 'https://github.com/wgkeeper/wgkeeper-console'},
            {label: 'Container images', href: 'https://github.com/orgs/wgkeeper/packages'},
          ],
        },
        {
          title: 'Releases and security',
          items: [
            {label: 'Releases: node', href: 'https://github.com/wgkeeper/wgkeeper-node/releases'},
            {label: 'Releases: console', href: 'https://github.com/wgkeeper/wgkeeper-console/releases'},
            {label: 'Report a vulnerability', href: 'https://github.com/wgkeeper/wgkeeper-node/security/advisories/new'},
          ],
        },
      ],
      copyright: `AGPL-3.0 · © ${new Date().getFullYear()} wgkeeper. WireGuard® is a registered trademark of Jason A. Donenfeld.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: neutralDark,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
