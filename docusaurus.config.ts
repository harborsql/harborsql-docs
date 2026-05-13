import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'HarborSQL',
  tagline: 'External SQL engine for Unity Catalog Delta tables',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://docs.harborsql.com',
  baseUrl: '/',

  organizationName: 'harborsql',
  projectName: 'harborsql-docs',

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
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/harborsql/harborsql-docs/tree/main/',
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
      title: 'HarborSQL',
      logo: {
        alt: 'HarborSQL logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/getting-started', label: 'Getting Started', position: 'left'},
        {to: '/benchmarks', label: 'Benchmarks', position: 'left'},
        {
          href: 'https://harborsql.com',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://github.com/harborsql/harborsql',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Overview',
              to: '/',
            },
            {
              label: 'Configuration',
              to: '/configuration',
            },
            {
              label: 'Result Types',
              to: '/result-types',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Marketing Site',
              href: 'https://harborsql.com',
            },
            {
              label: 'Source Repository',
              href: 'https://github.com/harborsql/harborsql',
            },
            {
              label: 'Releases',
              href: 'https://github.com/harborsql/harborsql/releases',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} HarborSQL contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
